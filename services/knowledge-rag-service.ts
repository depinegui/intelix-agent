import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import {
  OPENAI_EMBEDDING_MODEL,
  getOpenAiClient,
} from "@/lib/openai";

import type {
  KnowledgeCategory,
  RetrievedKnowledgeChunk,
} from "@/types";


const KNOWLEDGE_DIRECTORY = path.join(
  process.cwd(),
  "knowledge",
);

const KNOWLEDGE_INDEX_DIRECTORY = path.join(
  KNOWLEDGE_DIRECTORY,
  ".index",
);

const KNOWLEDGE_INDEX_FILE = path.join(
  KNOWLEDGE_INDEX_DIRECTORY,
  "knowledge-index.json",
);

const SUPPORTED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".pdf",
  ".docx",
  ".csv",
  ".xlsx",
]);

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;

// A margem sobe apenas 0,04 sobre o piso anterior (0,32);
// o filtro relativo abaixo continua sendo o principal
// criterio para nao descartar contexto util.
const MINIMUM_RELEVANCE_SCORE = 0.36;

// Nas consultas de validacao, 82% removeu a fonte de
// entrada de XML (0,4598) frente ao melhor resultado
// sobre nota autorizada (0,5697), sem remover os tres
// resultados complementares da rejeicao 204.
const RELATIVE_RELEVANCE_RATIO = 0.82;

const EXACT_REJECTION_CODE_BOOST = 0.18;
const DIFFERENT_REJECTION_CODE_PENALTY = 0.12;

const MATCHING_TITLE_INTENT_BONUS = 0.04;

const PROCEDURAL_QUERY_ERROR_TITLE_PENALTY = 0.35;

const MATCHING_CATEGORY_BONUS = 0.06;

const GENERIC_PROCEDURE_CATEGORY_PENALTY = 0.13;

const INCOMPATIBLE_CATEGORY_PENALTY = 0.1;

const NO_LEXICAL_SUPPORT_CATEGORY_PENALTY = 0.04;

const NEAR_DUPLICATE_TOKEN_OVERLAP = 0.8;

const EMBEDDING_BATCH_SIZE = 50;
const EMBEDDING_REQUEST_TIMEOUT_MS = 60_000;


const PORTUGUESE_STOPWORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "um",
  "uma",
  "para",
  "por",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "como",
  "faco",
  "quero",
  "preciso",
  "poderia",
  "pode",
  "me",
  "ajudar",
  "sistema",
]);


const indexedChunkSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),

  category: z.enum([
    "NF_E",
    "NFC_E",
    "ESTOQUE",
    "INVENTARIO",
    "PCP",
    "PROCEDIMENTOS",
  ]),

  source: z.string(),

  searchText: z
    .string()
    .optional(),

  embedding: z.array(
    z.number(),
  ),
});


const indexedFileSchema = z.object({
  source: z.string(),
  checksum: z.string(),

  chunks: z
    .number()
    .int()
    .nonnegative(),

  recordsFound: z
    .number()
    .int()
    .nonnegative()
    .optional(),

  recordsIndexed: z
    .number()
    .int()
    .nonnegative()
    .optional(),
});


const knowledgeIndexSchema = z.object({
  version: z
    .number()
    .int()
    .positive(),

  generatedAt: z.string(),

  embeddingModel: z.string(),

  knowledgeDirectory: z.string(),

  files: z.array(
    indexedFileSchema,
  ),

  chunks: z.array(
    indexedChunkSchema,
  ),
});


type IndexedChunk = z.infer<
  typeof indexedChunkSchema
>;

type KnowledgeIndex = z.infer<
  typeof knowledgeIndexSchema
>;


interface RawChunk {
  id: string;

  title: string;

  excerpt: string;

  content: string;

  category: KnowledgeCategory;

  source: string;

  searchText: string;
}


interface IndexedFileSummary {
  source: string;

  checksum: string;

  chunks: number;

  recordsFound: number;

  recordsIndexed: number;
}


interface ExtractedKnowledgeFile {
  checksum: string;

  chunks: RawChunk[];

  recordsFound: number;

  recordsIndexed: number;
}


interface ScoredKnowledgeChunk
  extends RetrievedKnowledgeChunk {
  semanticScore: number;

  lexicalScore: number;

  codeAdjustment: number;

  intentAdjustment: number;

  categoryAdjustment: number;

  titleIntent: KnowledgeIntent;

  searchableText: string;

  decision: KnowledgeSearchDecision;
}


type KnowledgeIntent =
  | "error"
  | "procedural"
  | "neutral";


type KnowledgeSearchDecision =
  | "approved"
  | "below-minimum-score"
  | "below-relative-score"
  | "near-duplicate"
  | "limit-reached";


export interface KnowledgeSearchDiagnosticEntry {
  title: string;

  source: string;

  score: number;

  semanticScore: number;

  lexicalScore: number;

  codeAdjustment: number;

  intentAdjustment: number;

  categoryAdjustment: number;

  titleIntent: KnowledgeIntent;

  category: KnowledgeCategory;

  decision: KnowledgeSearchDecision;
}


export interface KnowledgeSearchDiagnostic {
  query: string;

  queryIntent: KnowledgeIntent;

  queryCategory: KnowledgeCategory | null;

  queryTokens: string[];

  minimumScore: number;

  relativeScoreFloor: number | null;

  entries: KnowledgeSearchDiagnosticEntry[];
}


interface SpreadsheetKnowledgeRow {
  primaryQuestion: string;

  answer: string;

  variations: string[];

  categoryHint: string;

  userIntent: string;

  software: string;

  sourceLabel: string;

  status: string;

  notes: string;

  sheetName: string;

  rowNumber: number;
}


export interface KnowledgeIndexingResult {
  filesProcessed: number;

  chunksIndexed: number;

  recordsFound: number;

  recordsIndexed: number;

  knowledgeDirectory: string;

  indexFile: string;

  files: IndexedFileSummary[];

  documentsFound?: number;
  documentsImported?: number;
  documentsSkipped?: number;
  documentsWithError?: number;
}

export interface KnowledgeImportProgress {
  phase: "database" | "scan" | "document" | "embedding" | "completed";
  message: string;
  document?: string;
  current?: number;
  total?: number;
}

export interface KnowledgeIndexingOptions {
  onProgress?: (progress: KnowledgeImportProgress) => void;
}


let cachedIndex: KnowledgeIndex | null = null;

let cachedIndexVersion = "";


function normalizeWhitespace(
  input: string,
) {
  return input
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u0000/g, " ")
    .trim();
}


function normalizeForSearch(
  input: string,
) {
  return normalizeWhitespace(input)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();
}


function tokenize(
  input: string,
) {
  const normalizedTokens =
    normalizeForSearch(input)
      .split(/[^a-z0-9]+/i)
      .map(
        (token) =>
          token.trim(),
      )
      .filter(
        (token) =>
          token.length > 1,
      );

  const usefulTokens =
    normalizedTokens.filter(
      (token) =>
        !PORTUGUESE_STOPWORDS.has(
          token,
        ),
    );

  // Consultas muito curtas ainda podem usar o
  // comportamento anterior quando a remocao
  // de stopwords nao deixa nenhum termo informativo.
  return usefulTokens.length > 0
    ? usefulTokens
    : normalizedTokens;
}


function normalizeSpreadsheetHeader(
  input: string,
) {
  return normalizeForSearch(
    input,
  ).replace(
    /[^a-z0-9]/g,
    "",
  );
}


function normalizeSpreadsheetValue(
  value: unknown,
) {
  return normalizeWhitespace(
    String(value ?? ""),
  );
}


function dedupeStrings(
  values: string[],
) {
  const seen =
    new Set<string>();

  const unique: string[] = [];

  for (const value of values) {
    const trimmed =
      normalizeWhitespace(
        value,
      );

    if (!trimmed) {
      continue;
    }

    const key =
      normalizeForSearch(
        trimmed,
      );

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    unique.push(
      trimmed,
    );
  }

  return unique;
}


function splitQuestionVariations(
  input: string,
) {
  const normalized =
    normalizeWhitespace(
      input,
    );

  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split(/\n+/)
    .flatMap(
      (line) =>
        line.split(
          /\s*;\s*/,
        ),
    )
    .flatMap(
      (line) =>
        line.match(
          /[^?]+(?:\?|$)/g,
        ) ?? [line],
    )
    .map(
      (line) =>
        line.trim(),
    )
    .filter(Boolean)
    .map((line) =>
      line.endsWith("?")
        ? line
        : line
            .replace(
              /[.]+$/,
              "",
            )
            .trim(),
    );

  return dedupeStrings(
    lines,
  );
}


function createChunkId(
  source: string,
  content: string,
  index: number,
) {
  return crypto
    .createHash("sha1")
    .update(
      `${source}:${index}:${content}`,
    )
    .digest("hex");
}


function createExcerpt(
  content: string,
) {
  const normalized =
    normalizeWhitespace(
      content,
    ).replace(
      /\n+/g,
      " ",
    );

  return normalized.length > 220
    ? `${normalized
        .slice(0, 217)
        .trimEnd()}...`
    : normalized;
}


/**
 * Classifica o chunk em uma categoria do RAG.
 *
 * A prioridade e:
 *
 * 1. Nome/caminho do documento
 * 2. Conteudo
 *
 * Isso evita casos como "Baixa de Estoque"
 * virar NF_E apenas porque o manual tambem
 * menciona nota fiscal.
 */
function inferCategory(
  content: string,
  source: string,
): KnowledgeCategory {
  const normalizedSource =
    normalizeForSearch(
      source,
    );

  const searchable =
    normalizeForSearch(
      `${source} ${content}`,
    );

  // -----------------------------------------
  // 1. PRIORIDADE: NOME / CAMINHO DO ARQUIVO
  // -----------------------------------------

  if (
    normalizedSource.includes(
      "estoque",
    ) ||
    normalizedSource.includes(
      "saldo",
    )
  ) {
    return "ESTOQUE";
  }

  if (
    normalizedSource.includes(
      "inventario",
    ) ||
    normalizedSource.includes(
      "contagem",
    )
  ) {
    return "INVENTARIO";
  }

  if (
    normalizedSource.includes(
      "pcp",
    ) ||
    normalizedSource.includes(
      "produc",
    )
  ) {
    return "PCP";
  }

  if (
    normalizedSource.includes(
      "nfc-e",
    ) ||
    normalizedSource.includes(
      "nfce",
    ) ||
    normalizedSource.includes(
      "pdv",
    )
  ) {
    return "NFC_E";
  }

  if (
    normalizedSource.includes(
      "nf-e",
    ) ||
    normalizedSource.includes(
      "nfe",
    ) ||
    normalizedSource.includes(
      "rejeicao",
    )
  ) {
    return "NF_E";
  }

  // -------------------------
  // 2. ANALISA O CONTEUDO
  // -------------------------

  if (
    searchable.includes(
      "nfc-e",
    ) ||
    searchable.includes(
      " nfce ",
    ) ||
    searchable.includes(
      " pdv ",
    )
  ) {
    return "NFC_E";
  }

  if (
    searchable.includes(
      "estoque",
    ) ||
    searchable.includes(
      "saldo",
    )
  ) {
    return "ESTOQUE";
  }

  if (
    searchable.includes(
      "inventario",
    ) ||
    searchable.includes(
      "contagem",
    )
  ) {
    return "INVENTARIO";
  }

  if (
    searchable.includes(
      "pcp",
    ) ||
    searchable.includes(
      "produc",
    )
  ) {
    return "PCP";
  }

  if (
    searchable.includes(
      "nf-e",
    ) ||
    searchable.includes(
      " nfe ",
    ) ||
    searchable.includes(
      "sefaz",
    ) ||
    searchable.includes(
      "nota fiscal",
    ) ||
    searchable.includes(
      "rejeicao",
    )
  ) {
    return "NF_E";
  }

  return "PROCEDIMENTOS";
}


function extractTitle(
  content: string,
  source: string,
) {
  const lines =
    normalizeWhitespace(
      content,
    )
      .split("\n")
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean);

  const heading =
    lines.find(
      (line) =>
        line.startsWith("#"),
    );

  if (heading) {
    return heading
      .replace(
        /^#+\s*/,
        "",
      )
      .trim();
  }

  return path
    .basename(
      source,
      path.extname(source),
    )
    .replace(
      /[-_]/g,
      " ",
    )
    .trim();
}


function splitLongSegment(
  segment: string,
) {
  const parts: string[] = [];

  let cursor = 0;

  while (
    cursor < segment.length
  ) {
    const nextCursor =
      Math.min(
        cursor + CHUNK_SIZE,
        segment.length,
      );

    const slice =
      segment
        .slice(
          cursor,
          nextCursor,
        )
        .trim();

    if (slice) {
      parts.push(slice);
    }

    if (
      nextCursor >=
      segment.length
    ) {
      break;
    }

    cursor =
      Math.max(
        nextCursor -
          CHUNK_OVERLAP,
        cursor + 1,
      );
  }

  return parts;
}


function chunkDocument(
  content: string,
) {
  const paragraphs =
    normalizeWhitespace(
      content,
    )
      .split(/\n{2,}/)
      .map(
        (paragraph) =>
          paragraph.trim(),
      )
      .filter(Boolean);

  if (
    paragraphs.length === 0
  ) {
    return [];
  }

  const chunks: string[] = [];

  let buffer = "";

  for (
    const paragraph
    of paragraphs
  ) {
    if (
      paragraph.length >
      CHUNK_SIZE
    ) {
      if (buffer) {
        chunks.push(
          buffer.trim(),
        );

        buffer = "";
      }

      chunks.push(
        ...splitLongSegment(
          paragraph,
        ),
      );

      continue;
    }

    const candidate =
      buffer
        ? `${buffer}\n\n${paragraph}`
        : paragraph;

    if (
      candidate.length <=
      CHUNK_SIZE
    ) {
      buffer = candidate;

      continue;
    }

    if (buffer) {
      chunks.push(
        buffer.trim(),
      );
    }

    buffer = paragraph;
  }

  if (buffer) {
    chunks.push(
      buffer.trim(),
    );
  }

  return chunks;
}


function cosineSimilarity(
  left: number[],
  right: number[],
) {
  let dotProduct = 0;

  let leftMagnitude = 0;

  let rightMagnitude = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    dotProduct +=
      left[index] *
      right[index];

    leftMagnitude +=
      left[index] ** 2;

    rightMagnitude +=
      right[index] ** 2;
  }

  if (
    !leftMagnitude ||
    !rightMagnitude
  ) {
    return 0;
  }

  return (
    dotProduct /
    (
      Math.sqrt(
        leftMagnitude,
      ) *
      Math.sqrt(
        rightMagnitude,
      )
    )
  );
}


function lexicalSimilarity(
  query: string,
  searchableText: string,
) {
  const queryTokens =
    new Set(
      tokenize(query),
    );

  const contentTokens =
    new Set(
      tokenize(
        searchableText,
      ),
    );

  if (
    queryTokens.size === 0 ||
    contentTokens.size === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (
    const token
    of queryTokens
  ) {
    if (
      contentTokens.has(
        token,
      )
    ) {
      matches += 1;
    }
  }

  return (
    matches /
    queryTokens.size
  );
}


function detectKnowledgeIntent(
  input: string,
): KnowledgeIntent {
  const normalized =
    normalizeForSearch(
      input,
    );

  const errorSignals = [
    "rejeicao",
    "erro",
    "falha",
    "problema",
    "denegada",
    "denegado",
    "recusada",
    "recusado",
  ];

  // Erro tem precedencia:
  // "como resolver uma rejeicao"
  // nao deve ser tratado como
  // solicitacao procedural generica.
  if (
    errorSignals.some(
      (signal) =>
        normalized.includes(
          signal,
        ),
    )
  ) {
    return "error";
  }

  const proceduralSignals = [
    "como faco",
    "como emitir",
    "emitir",
    "cadastrar",
    "consultar",
    "gerar",
    "configurar",
    "realizar",
    "procedimento",
    "passo a passo",
  ];

  return proceduralSignals.some(
    (signal) =>
      normalized.includes(
        signal,
      ),
  )
    ? "procedural"
    : "neutral";
}


function getIntentAdjustment(
  queryIntent: KnowledgeIntent,
  titleIntent: KnowledgeIntent,
) {
  if (
    queryIntent ===
      "procedural" &&
    titleIntent ===
      "error"
  ) {
    // Evita que a palavra NF-e faca
    // um titulo de rejeicao dominar
    // uma pergunta de procedimento.
    return (
      -PROCEDURAL_QUERY_ERROR_TITLE_PENALTY
    );
  }

  if (
    queryIntent !== "neutral" &&
    queryIntent ===
      titleIntent
  ) {
    return (
      MATCHING_TITLE_INTENT_BONUS
    );
  }

  // Manuais procedurais continuam
  // elegiveis para consultas de erro
  // como contexto complementar.
  return 0;
}


function inferQueryCategory(
  input: string,
): KnowledgeCategory | null {
  const normalized =
    normalizeForSearch(
      input,
    );

  if (
    normalized.includes(
      "nfc-e",
    ) ||
    normalized.includes(
      "nfce",
    ) ||
    normalized.includes(
      "cupom fiscal",
    ) ||
    normalized.includes(
      "pdv",
    )
  ) {
    return "NFC_E";
  }

  if (
    normalized.includes(
      "nf-e",
    ) ||
    normalized.includes(
      "nfe",
    ) ||
    normalized.includes(
      "nota fiscal",
    ) ||
    normalized.includes(
      "sefaz",
    )
  ) {
    return "NF_E";
  }

  if (
    normalized.includes(
      "estoque",
    ) ||
    normalized.includes(
      "saldo de produto",
    ) ||
    normalized.includes(
      "movimentacao de estoque",
    )
  ) {
    return "ESTOQUE";
  }

  if (
    normalized.includes(
      "inventario",
    ) ||
    normalized.includes(
      "contagem",
    )
  ) {
    return "INVENTARIO";
  }

  if (
    normalized.includes(
      "pcp",
    ) ||
    normalized.includes(
      "producao",
    ) ||
    normalized.includes(
      "ordem de producao",
    )
  ) {
    return "PCP";
  }

  return normalized.includes(
    "procedimento",
  )
    ? "PROCEDIMENTOS"
    : null;
}


function getCategoryAdjustment(
  queryCategory:
    | KnowledgeCategory
    | null,
  chunkCategory:
    KnowledgeCategory,
  lexicalScore: number,
  queryIntent:
    KnowledgeIntent,
  titleIntent:
    KnowledgeIntent,
) {
  if (!queryCategory) {
    return 0;
  }

  let adjustment = 0;

  if (
    queryCategory ===
    chunkCategory
  ) {
    adjustment =
      queryIntent ===
        "procedural" &&
      titleIntent ===
        "error"
        ? 0
        : MATCHING_CATEGORY_BONUS;
  } else if (
    chunkCategory ===
    "PROCEDIMENTOS"
  ) {
    adjustment =
      -GENERIC_PROCEDURE_CATEGORY_PENALTY;
  } else {
    adjustment =
      -INCOMPATIBLE_CATEGORY_PENALTY;
  }

  return (
    lexicalScore === 0 &&
    chunkCategory !==
      queryCategory
  )
    ? adjustment -
        NO_LEXICAL_SUPPORT_CATEGORY_PENALTY
    : adjustment;
}


function extractRejectionCodes(
  input: string,
) {
  const normalized =
    normalizeForSearch(
      input,
    );

  if (
    !normalized.includes(
      "rejeicao",
    )
  ) {
    return new Set<string>();
  }

  // Tres digitos, no contexto de rejeicao,
  // evita tratar anos e quantidades comuns
  // como codigos fiscais.
  return new Set(
    normalized.match(
      /\b[1-9]\d{2}\b/g,
    ) ?? [],
  );
}


function getCodeAdjustment(
  queryCodes: Set<string>,
  searchableText: string,
) {
  if (
    queryCodes.size === 0
  ) {
    return 0;
  }

  const chunkCodes =
    new Set(
      normalizeForSearch(
        searchableText,
      ).match(
        /\b[1-9]\d{2}\b/g,
      ) ?? [],
    );

  if (
    [...queryCodes].some(
      (code) =>
        chunkCodes.has(
          code,
        ),
    )
  ) {
    return (
      EXACT_REJECTION_CODE_BOOST
    );
  }

  return chunkCodes.size > 0
    ? -DIFFERENT_REJECTION_CODE_PENALTY
    : 0;
}


function tokenOverlap(
  left: string,
  right: string,
) {
  const leftTokens =
    new Set(
      tokenize(left),
    );

  const rightTokens =
    new Set(
      tokenize(right),
    );

  if (
    leftTokens.size === 0 ||
    rightTokens.size === 0
  ) {
    return 0;
  }

  const shared =
    [...leftTokens].filter(
      (token) =>
        rightTokens.has(
          token,
        ),
    ).length;

  return (
    shared /
    Math.min(
      leftTokens.size,
      rightTokens.size,
    )
  );
}


function isNearDuplicate(
  candidate:
    ScoredKnowledgeChunk,
  selected:
    ScoredKnowledgeChunk,
) {
  const overlap =
    tokenOverlap(
      candidate.searchableText,
      selected.searchableText,
    );

  const sameSource =
    candidate.source ===
    selected.source;

  const sameTitle =
    normalizeForSearch(
      candidate.title,
    ) ===
    normalizeForSearch(
      selected.title,
    );

  return (
    overlap >=
      NEAR_DUPLICATE_TOKEN_OVERLAP &&
    (
      sameSource ||
      sameTitle ||
      overlap >= 0.95
    )
  );
}


function createIndexedChunk(
  params: {
    content: string;

    title: string;

    source: string;

    index: number;

    excerpt?: string;

    searchText?: string;

    categoryHint?: string;
  },
): RawChunk {
  const searchText =
    normalizeWhitespace(
      params.searchText ??
        `${params.title}\n${params.content}`,
    );

  const content =
    normalizeWhitespace(
      params.content,
    );

  return {
    id: createChunkId(
      params.source,
      searchText,
      params.index,
    ),

    title:
      normalizeWhitespace(
        params.title,
      ),

    excerpt:
      createExcerpt(
        params.excerpt ??
          content,
      ),

    content,

    category:
      inferCategory(
        `${params.categoryHint ?? ""}\n${searchText}\n${content}`,
        params.source,
      ),

    source:
      params.source,

    searchText,
  };
}


function createGenericChunksFromText(
  rawText: string,
  relativeSource: string,
): RawChunk[] {
  const title =
    extractTitle(
      rawText,
      relativeSource,
    );

  return chunkDocument(
    rawText,
  ).map(
    (chunk, index) =>
      createIndexedChunk({
        content: chunk,

        title,

        source:
          relativeSource,

        index,
      }),
  );
}


function getSpreadsheetCell(
  row:
    Record<
      string,
      unknown
    >,
  expectedHeaders:
    string[],
) {
  const expected =
    new Set(
      expectedHeaders.map(
        normalizeSpreadsheetHeader,
      ),
    );

  for (
    const [
      header,
      value,
    ]
    of Object.entries(row)
  ) {
    if (
      expected.has(
        normalizeSpreadsheetHeader(
          header,
        ),
      )
    ) {
      return normalizeSpreadsheetValue(
        value,
      );
    }
  }

  return "";
}


function buildSpreadsheetRow(
  row:
    Record<
      string,
      unknown
    >,
  sheetName: string,
  rowNumber: number,
): SpreadsheetKnowledgeRow | null {
  const primaryQuestion =
    getSpreadsheetCell(
      row,
      [
        "Pergunta Principal",
      ],
    );

  const answer =
    getSpreadsheetCell(
      row,
      [
        "Resposta",
      ],
    );

  const variationText =
    getSpreadsheetCell(
      row,
      [
        "Variações da Pergunta",
      ],
    );

  const categoryHint =
    getSpreadsheetCell(
      row,
      [
        "Tópico/Categoria",
        "Categoria/Tópico",
      ],
    );

  const userIntent =
    getSpreadsheetCell(
      row,
      [
        "Intenção do Usuário",
      ],
    );

  const software =
    getSpreadsheetCell(
      row,
      [
        "Software",
      ],
    );

  const sourceLabel =
    getSpreadsheetCell(
      row,
      [
        "Fonte da Informação",
        "Fonte",
      ],
    );

  const status =
    getSpreadsheetCell(
      row,
      [
        "Status (Revisado/Aprovado)",
        "Status",
      ],
    );

  const notes =
    getSpreadsheetCell(
      row,
      [
        "Observações/Notas",
        "Observações",
      ],
    );

  if (
    !primaryQuestion &&
    !answer
  ) {
    return null;
  }

  return {
    primaryQuestion,

    answer,

    variations:
      splitQuestionVariations(
        variationText,
      ),

    categoryHint,

    userIntent,

    software,

    sourceLabel,

    status,

    notes,

    sheetName,

    rowNumber,
  };
}


function formatBulletList(
  items: string[],
) {
  return items
    .map(
      (item) =>
        `- ${item}`,
    )
    .join("\n");
}


function createSpreadsheetChunk(
  row:
    SpreadsheetKnowledgeRow,
  relativeSource: string,
): RawChunk | null {
  if (
    !row.primaryQuestion ||
    !row.answer
  ) {
    return null;
  }

  const variations =
    dedupeStrings([
      row.primaryQuestion,
      ...row.variations,
    ]);

  const contentSections = [
    "Resposta principal:",

    row.answer,

    `Pergunta principal: ${row.primaryQuestion}`,

    variations.length > 1
      ? `Variacoes da pergunta:\n${formatBulletList(
          variations.filter(
            (variation) =>
              variation !==
              row.primaryQuestion,
          ),
        )}`
      : "",

    row.categoryHint
      ? `Categoria/Tópico: ${row.categoryHint}`
      : "",

    row.userIntent
      ? `Intencao do usuario: ${row.userIntent}`
      : "",

    row.software
      ? `Software: ${row.software}`
      : "",

    row.sourceLabel
      ? `Fonte: ${row.sourceLabel}`
      : "",

    row.status
      ? `Status: ${row.status}`
      : "",

    row.notes
      ? `Observacoes: ${row.notes}`
      : "",
  ].filter(Boolean);


  const searchText = [
    row.primaryQuestion,

    variations.join(
      "\n",
    ),

    row.categoryHint,

    row.userIntent,

    row.software,

    row.answer,
  ]
    .filter(Boolean)
    .join("\n");


  const rowSource =
    `${relativeSource}#${row.sheetName}-linha-${row.rowNumber}`;


  return createIndexedChunk({
    content:
      contentSections.join(
        "\n\n",
      ),

    title:
      row.primaryQuestion,

    source:
      rowSource,

    index:
      row.rowNumber,

    excerpt:
      row.answer,

    searchText,

    categoryHint:
      row.categoryHint,
  });
}


async function ensureKnowledgeDirectory() {
  await fs.mkdir(
    KNOWLEDGE_DIRECTORY,
    {
      recursive: true,
    },
  );
}


async function listKnowledgeFiles(
  directory =
    KNOWLEDGE_DIRECTORY,
) {
  const entries =
    await fs.readdir(
      directory,
      {
        withFileTypes: true,
      },
    );

  const files: string[] = [];

  for (
    const entry
    of entries
  ) {
    if (
      entry.name.startsWith(
        ".",
      )
    ) {
      continue;
    }

    const absolutePath =
      path.join(
        directory,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      files.push(
        ...(
          await listKnowledgeFiles(
            absolutePath,
          )
        ),
      );

      continue;
    }

    if (
      SUPPORTED_EXTENSIONS.has(
        path
          .extname(
            entry.name,
          )
          .toLowerCase(),
      )
    ) {
      files.push(
        absolutePath,
      );
    }
  }

  return files.sort(
    (
      left,
      right,
    ) =>
      left.localeCompare(
        right,
      ),
  );
}


async function extractRawTextFromFile(
  filePath: string,
) {
  const extension =
    path
      .extname(
        filePath,
      )
      .toLowerCase();

  return extractRawTextFromBuffer(
    await fs.readFile(filePath),
    extension,
  );
}


async function extractRawTextFromPdfBuffer(
  fileBuffer: Buffer,
) {
  const {
    default: PDFParser,
  } =
    await import(
      "pdf2json"
    );

  // pdf2json reads from the beginning of the underlying ArrayBuffer. Database
  // buffers may be pooled views, so retain the document in memory while giving
  // the parser a dedicated buffer with byteOffset zero.
  const parserBuffer =
    Buffer.allocUnsafeSlow(
      fileBuffer.length,
    );

  fileBuffer.copy(
    parserBuffer,
  );

  return new Promise<string>(
    (
      resolve,
      reject,
    ) => {
      const parser =
        new PDFParser(
          null,
          true,
        );

      const cleanup = () => {
        parser.removeAllListeners();
        parser.destroy();
      };

      parser.once(
        "pdfParser_dataReady",
        () => {
          try {
            const text =
              parser.getRawTextContent();

            cleanup();
            resolve(text);
          } catch (error) {
            cleanup();
            reject(error);
          }
        },
      );

      parser.once(
        "pdfParser_dataError",
        (
          error,
        ) => {
          cleanup();

          reject(
            error instanceof Error
              ? error
              : error.parserError,
          );
        },
      );

      try {
        parser.parseBuffer(
          parserBuffer,
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    },
  );
}


async function extractRawTextFromBuffer(
  fileBuffer: Buffer,
  extension: string,
) {
  if (extension === ".txt" || extension === ".md" || extension === ".csv") {
    return normalizeWhitespace(fileBuffer.toString("utf8"));
  }

  if (
    extension === ".pdf"
  ) {
    return normalizeWhitespace(
      await extractRawTextFromPdfBuffer(
        fileBuffer,
      ),
    );
  }

  if (
    extension === ".docx"
  ) {
    const mammoth =
      await import(
        "mammoth"
      );

    const result =
      await mammoth.extractRawText({ buffer: fileBuffer });

    return normalizeWhitespace(
      result.value,
    );
  }

  return "";
}


async function extractSpreadsheetKnowledge(
  filePath: string,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const fileBuffer =
    await fs.readFile(
      filePath,
    );

  const checksum =
    crypto
      .createHash("sha1")
      .update(fileBuffer)
      .digest("hex");

  const XLSX =
    await import(
      "xlsx"
    );

  const workbook =
    XLSX.read(
      fileBuffer,
      {
        type: "buffer",
        cellDates: false,
      },
    );

  const chunks:
    RawChunk[] = [];

  let recordsFound = 0;

  let recordsIndexed = 0;


  for (
    const sheetName
    of workbook.SheetNames
  ) {
    const sheet =
      workbook.Sheets[
        sheetName
      ];

    const rows =
      XLSX.utils
        .sheet_to_json<
          Record<
            string,
            unknown
          >
        >(
          sheet,
          {
            defval: "",
            raw: false,
          },
        );

    rows.forEach(
      (
        row,
        rowIndex,
      ) => {
        const parsedRow =
          buildSpreadsheetRow(
            row,
            sheetName,
            rowIndex + 2,
          );

        if (!parsedRow) {
          return;
        }

        recordsFound += 1;

        const chunk =
          createSpreadsheetChunk(
            parsedRow,
            relativeSource,
          );

        if (!chunk) {
          return;
        }

        recordsIndexed += 1;

        chunks.push(
          chunk,
        );
      },
    );
  }


  return {
    checksum,

    chunks,

    recordsFound,

    recordsIndexed,
  };
}


async function extractSpreadsheetKnowledgeFromBuffer(
  fileBuffer: Buffer,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const checksum = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: false });
  const chunks: RawChunk[] = [];
  let recordsFound = 0;
  let recordsIndexed = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    rows.forEach((row, rowIndex) => {
      const parsedRow = buildSpreadsheetRow(row, sheetName, rowIndex + 2);
      if (!parsedRow) return;
      recordsFound += 1;
      const chunk = createSpreadsheetChunk(parsedRow, relativeSource);
      if (!chunk) return;
      recordsIndexed += 1;
      chunks.push(chunk);
    });
  }

  return { checksum, chunks, recordsFound, recordsIndexed };
}


async function extractKnowledgeBuffer(
  fileBuffer: Buffer,
  fileName: string,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const extension = path.extname(fileName).toLowerCase();
  if (extension === ".xlsx") {
    return extractSpreadsheetKnowledgeFromBuffer(fileBuffer, relativeSource);
  }

  const checksum = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  const rawText = await extractRawTextFromBuffer(fileBuffer, extension);
  if (!rawText) return { checksum, chunks: [], recordsFound: 0, recordsIndexed: 0 };
  return {
    checksum,
    chunks: createGenericChunksFromText(rawText, relativeSource),
    recordsFound: 1,
    recordsIndexed: 1,
  };
}


async function extractKnowledgeFile(
  filePath: string,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const extension =
    path
      .extname(
        filePath,
      )
      .toLowerCase();

  if (
    extension === ".xlsx"
  ) {
    return extractSpreadsheetKnowledge(
      filePath,
      relativeSource,
    );
  }

  const fileBuffer =
    await fs.readFile(
      filePath,
    );

  const checksum =
    crypto
      .createHash("sha1")
      .update(fileBuffer)
      .digest("hex");

  const rawText =
    await extractRawTextFromFile(
      filePath,
    );

  if (!rawText) {
    return {
      checksum,

      chunks: [],

      recordsFound: 0,

      recordsIndexed: 0,
    };
  }

  return {
    checksum,

    chunks:
      createGenericChunksFromText(
        rawText,
        relativeSource,
      ),

    recordsFound: 1,

    recordsIndexed: 1,
  };
}


async function createEmbeddings(
  input: string[],
  onBatchProgress?: (current: number, total: number) => void,
) {
  const client =
    getOpenAiClient();

  const embeddings:
    number[][] = [];

  const totalBatches = Math.ceil(input.length / EMBEDDING_BATCH_SIZE);

  for (
    let index = 0;
    index < input.length;
    index += EMBEDDING_BATCH_SIZE
  ) {
    const batch =
      input.slice(
        index,
        index +
          EMBEDDING_BATCH_SIZE,
      );

    const batchNumber = Math.floor(index / EMBEDDING_BATCH_SIZE) + 1;
    onBatchProgress?.(batchNumber, totalBatches);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), EMBEDDING_REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await client.embeddings.create(
        {
          model: OPENAI_EMBEDDING_MODEL,
          input: batch,
        },
        { signal: controller.signal },
      );
    } catch (error) {
      const reason = controller.signal.aborted
        ? `Tempo limite de ${EMBEDDING_REQUEST_TIMEOUT_MS / 1000}s excedido ao gerar embeddings.`
        : error instanceof Error
          ? error.message
          : "Falha desconhecida ao gerar embeddings.";
      throw new Error(reason, { cause: error });
    } finally {
      clearTimeout(timeout);
    }

    embeddings.push(
      ...response.data.map(
        (item) =>
          item.embedding,
      ),
    );
  }

  return embeddings;
}


function getPersistentSource(document: {
  sourceKey: string | null;
  slug: string;
}) {
  return document.sourceKey ?? `manual:${document.slug}`;
}


export async function processPersistentKnowledgeDocument(
  documentId: string,
  options?: Pick<KnowledgeIndexingOptions, "onProgress">,
) {
  if (!prisma) {
    throw new Error("O processamento persistente requer um banco de dados configurado.");
  }

  const document = await prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
  if (!document) throw new Error("Documento da base nao encontrado.");

  await prisma.knowledgeDocument.update({
    where: { id: document.id },
    data: { processingStatus: "PROCESSING", processingError: null },
  });

  try {
    options?.onProgress?.({
      phase: "document",
      message: "Extraindo conteúdo e preparando chunks.",
      document: document.fileName ?? document.title,
    });

    const source = getPersistentSource(document);
    const extracted = document.fileData
      ? await extractKnowledgeBuffer(Buffer.from(document.fileData), document.fileName ?? document.title, source)
      : {
          checksum: document.contentHash ?? crypto.createHash("sha1").update(document.content).digest("hex"),
          chunks: createGenericChunksFromText(document.content, source),
          recordsFound: 1,
          recordsIndexed: 1,
        };

    if (extracted.chunks.length === 0) {
      throw new Error("Nao foi possivel extrair conteudo textual do documento.");
    }

    const embeddings = await createEmbeddings(
      extracted.chunks.map((chunk) => chunk.searchText),
      (current, total) => options?.onProgress?.({
        phase: "embedding",
        message: `Gerando embeddings (${current}/${total}).`,
        document: document.fileName ?? document.title,
        current,
        total,
      }),
    );
    const extractedContent = extracted.chunks.map((chunk) => chunk.content).join("\n\n");
    const firstChunk = extracted.chunks[0];

    await prisma.$transaction([
      prisma.knowledgeChunk.deleteMany({ where: { documentId: document.id } }),
      prisma.knowledgeChunk.createMany({
        data: extracted.chunks.map((chunk, index) => ({
          documentId: document.id,
          chunkIndex: index,
          content: chunk.content,
          excerpt: chunk.excerpt,
          searchText: chunk.searchText,
          embedding: embeddings[index],
          metadata: { source: chunk.source, chunkId: chunk.id },
        })),
      }),
      prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          content: extractedContent,
          excerpt: firstChunk.excerpt,
          contentHash: document.contentHash ?? extracted.checksum,
          processingStatus: "READY",
          processingError: null,
          processedAt: new Date(),
        },
      }),
    ]);

    options?.onProgress?.({
      phase: "document",
      message: `Concluído com ${extracted.chunks.length} chunk(s).`,
      document: document.fileName ?? document.title,
    });

    return { documentId: document.id, chunksIndexed: extracted.chunks.length, recordsFound: extracted.recordsFound, recordsIndexed: extracted.recordsIndexed };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida no processamento.";
    await prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { processingStatus: "ERROR", processingError: message, processedAt: null },
    });
    options?.onProgress?.({
      phase: "document",
      message: `Falhou: ${message}`,
      document: document.fileName ?? document.title,
    });
    throw error;
  }
}


async function readPersistentKnowledgeIndex(): Promise<KnowledgeIndex> {
  if (!prisma) throw new Error("Banco de dados nao configurado.");
  const chunks = await prisma.knowledgeChunk.findMany({
    where: { document: { processingStatus: "READY" } },
    include: { document: true },
    orderBy: [{ documentId: "asc" }, { chunkIndex: "asc" }],
  });
  return {
    version: 3,
    generatedAt: new Date().toISOString(),
    embeddingModel: OPENAI_EMBEDDING_MODEL,
    knowledgeDirectory: "postgresql",
    files: [],
    chunks: chunks.flatMap((chunk) => {
      if (!Array.isArray(chunk.embedding)) return [];
      const source = typeof chunk.metadata === "object" && chunk.metadata && "source" in chunk.metadata
        ? String((chunk.metadata as { source: unknown }).source)
        : getPersistentSource(chunk.document);
      return [{
        id: chunk.id,
        title: chunk.document.title,
        excerpt: chunk.excerpt,
        content: chunk.content,
        category: chunk.document.category,
        source,
        searchText: chunk.searchText,
        embedding: chunk.embedding as number[],
      }];
    }),
  };
}


async function readKnowledgeIndex() {
  if (prisma) {
    return readPersistentKnowledgeIndex();
  }

  try {
    const stats =
      await fs.stat(
        KNOWLEDGE_INDEX_FILE,
      );

    const cacheKey =
      `${stats.mtimeMs}:${stats.size}`;

    if (
      cachedIndex &&
      cachedIndexVersion ===
        cacheKey
    ) {
      return cachedIndex;
    }

    const raw =
      await fs.readFile(
        KNOWLEDGE_INDEX_FILE,
        "utf8",
      );

    const parsed =
      knowledgeIndexSchema.parse(
        JSON.parse(raw),
      );

    cachedIndex =
      parsed;

    cachedIndexVersion =
      cacheKey;

    return parsed;
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code ===
        "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}


export function getKnowledgePaths() {
  if (prisma) {
    return {
      knowledgeDirectory: "postgresql",
      indexFile: "postgresql:KnowledgeChunk",
    };
  }

  return {
    knowledgeDirectory:
      KNOWLEDGE_DIRECTORY,

    indexFile:
      KNOWLEDGE_INDEX_FILE,
  };
}


export async function hasIndexedKnowledgeBase() {
  return (
    await readKnowledgeIndex()
  ) !== null;
}


async function indexPersistentKnowledgeBase(
  options?: KnowledgeIndexingOptions,
): Promise<KnowledgeIndexingResult> {
  if (!prisma) throw new Error("Banco de dados nao configurado.");

  const indexedFiles: IndexedFileSummary[] = [];
  let chunksIndexed = 0;
  let recordsFound = 0;
  let recordsIndexed = 0;
  let documentsImported = 0;
  let documentsSkipped = 0;
  let documentsWithError = 0;

  // Existing Prisma documents predate persistent chunks. Process only records
  // without chunks or records explicitly pending/error; READY records with
  // chunks are never re-embedded by this incremental synchronisation.
  const existingDocuments = await prisma.knowledgeDocument.findMany({
    where: { origin: { not: "LEGACY_IMPORT" } },
    include: { _count: { select: { chunks: true } } },
  });
  options?.onProgress?.({
    phase: "database",
    message: `Verificando ${existingDocuments.length} documento(s) já persistido(s).`,
  });
  for (const document of existingDocuments) {
    if (document.processingStatus === "READY" && document._count.chunks > 0) continue;
    try {
      const result = await processPersistentKnowledgeDocument(document.id, options);
      chunksIndexed += result.chunksIndexed;
      recordsFound += result.recordsFound;
      recordsIndexed += result.recordsIndexed;
      documentsImported += 1;
    } catch {
      documentsWithError += 1;
    }
  }

  // Files in /knowledge are an import source used by this explicit script only.
  // They are never read by the production request path after import.
  const knowledgeFiles = await listKnowledgeFiles();
  options?.onProgress?.({
    phase: "scan",
    message: `${knowledgeFiles.length} arquivo(s) legado(s) encontrado(s).`,
    total: knowledgeFiles.length,
  });
  for (const [fileIndex, filePath] of knowledgeFiles.entries()) {
    const relativeSource = path.relative(KNOWLEDGE_DIRECTORY, filePath).replace(/\\/g, "/");
    options?.onProgress?.({
      phase: "document",
      message: "Lendo e comparando hash.",
      document: relativeSource,
      current: fileIndex + 1,
      total: knowledgeFiles.length,
    });

    try {
      const fileData = await fs.readFile(filePath);
      const contentHash = crypto.createHash("sha256").update(fileData).digest("hex");
      const sourceKey = `legacy:${relativeSource}`;
      const existing = await prisma.knowledgeDocument.findUnique({
        where: { sourceKey },
        include: { _count: { select: { chunks: true } } },
      });

      if (existing && existing.contentHash === contentHash && existing.processingStatus === "READY" && existing._count.chunks > 0) {
        documentsSkipped += 1;
        indexedFiles.push({ source: relativeSource, checksum: contentHash, chunks: existing._count.chunks, recordsFound: 0, recordsIndexed: 0 });
        options?.onProgress?.({ phase: "document", message: "Ignorado: já está pronto e inalterado.", document: relativeSource, current: fileIndex + 1, total: knowledgeFiles.length });
        continue;
      }

      const title = extractTitle("", relativeSource) || "Documento legado";
      const category = inferCategory("", relativeSource);
      const document = existing
        ? await prisma.knowledgeDocument.update({
            where: { id: existing.id },
            data: { title, category, fileName: path.basename(relativeSource), mimeType: "application/octet-stream", fileSize: fileData.length, fileData, contentHash, processingStatus: "PENDING", processingError: null },
          })
        : await prisma.knowledgeDocument.create({
            data: { title, slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "documento"}-${contentHash.slice(0, 8)}`, excerpt: "Documento legado aguardando processamento.", content: "", category, tags: [], origin: "LEGACY_IMPORT", processingStatus: "PENDING", sourceKey, contentHash, fileName: path.basename(relativeSource), mimeType: "application/octet-stream", fileSize: fileData.length, fileData },
          });

      const result = await processPersistentKnowledgeDocument(document.id, options);
      documentsImported += 1;
      chunksIndexed += result.chunksIndexed;
      recordsFound += result.recordsFound;
      recordsIndexed += result.recordsIndexed;
      indexedFiles.push({ source: relativeSource, checksum: contentHash, chunks: result.chunksIndexed, recordsFound: result.recordsFound, recordsIndexed: result.recordsIndexed });
    } catch (error) {
      documentsWithError += 1;
      const message = error instanceof Error ? error.message : "Falha desconhecida.";
      options?.onProgress?.({ phase: "document", message: `Erro registrado; seguindo para o próximo: ${message}`, document: relativeSource, current: fileIndex + 1, total: knowledgeFiles.length });
    }
  }

  return {
    filesProcessed: indexedFiles.length,
    chunksIndexed,
    recordsFound,
    recordsIndexed,
    knowledgeDirectory: "postgresql",
    indexFile: "postgresql:KnowledgeChunk",
    files: indexedFiles,
    documentsFound: knowledgeFiles.length,
    documentsImported,
    documentsSkipped,
    documentsWithError,
  };
}


export async function indexKnowledgeBase(
  options?: KnowledgeIndexingOptions,
):
Promise<KnowledgeIndexingResult> {
  if (prisma) {
    const result = await indexPersistentKnowledgeBase(options);
    options?.onProgress?.({
      phase: "completed",
      message: "Importação persistente concluída.",
    });
    return result;
  }

  await ensureKnowledgeDirectory();

  const knowledgeFiles =
    await listKnowledgeFiles();

  if (
    knowledgeFiles.length === 0
  ) {
    throw new Error(
      "Nenhum arquivo suportado foi encontrado na pasta /knowledge. Adicione arquivos .txt, .md, .pdf, .docx, .csv ou .xlsx antes de indexar.",
    );
  }


  const chunkDrafts:
    RawChunk[] = [];

  const indexedFiles:
    IndexedFileSummary[] = [];


  for (
    const filePath
    of knowledgeFiles
  ) {
    const relativeSource =
      path.relative(
        KNOWLEDGE_DIRECTORY,
        filePath,
      );

    const extracted =
      await extractKnowledgeFile(
        filePath,
        relativeSource,
      );

    chunkDrafts.push(
      ...extracted.chunks,
    );

    indexedFiles.push({
      source:
        relativeSource,

      checksum:
        extracted.checksum,

      chunks:
        extracted.chunks.length,

      recordsFound:
        extracted.recordsFound,

      recordsIndexed:
        extracted.recordsIndexed,
    });
  }


  if (
    chunkDrafts.length === 0
  ) {
    throw new Error(
      "Nao foi possivel extrair conteudo textual dos arquivos encontrados na pasta /knowledge.",
    );
  }


  const embeddings =
    await createEmbeddings(
      chunkDrafts.map(
        (chunk) =>
          chunk.searchText,
      ),
    );


  const chunks:
    IndexedChunk[] =
      chunkDrafts.map(
        (
          chunk,
          index,
        ) => ({
          ...chunk,

          embedding:
            embeddings[index],
        }),
      );


  const index:
    KnowledgeIndex = {
      version: 2,

      generatedAt:
        new Date()
          .toISOString(),

      embeddingModel:
        OPENAI_EMBEDDING_MODEL,

      knowledgeDirectory:
        KNOWLEDGE_DIRECTORY,

      files:
        indexedFiles,

      chunks,
    };


  await fs.mkdir(
    KNOWLEDGE_INDEX_DIRECTORY,
    {
      recursive: true,
    },
  );


  await fs.writeFile(
    KNOWLEDGE_INDEX_FILE,
    JSON.stringify(
      index,
      null,
      2,
    ),
    "utf8",
  );


  cachedIndex =
    index;

  cachedIndexVersion =
    "";


  return {
    filesProcessed:
      indexedFiles.length,

    chunksIndexed:
      chunks.length,

    recordsFound:
      indexedFiles.reduce(
        (
          total,
          fileSummary,
        ) =>
          total +
          fileSummary.recordsFound,
        0,
      ),

    recordsIndexed:
      indexedFiles.reduce(
        (
          total,
          fileSummary,
        ) =>
          total +
          fileSummary.recordsIndexed,
        0,
      ),

    knowledgeDirectory:
      KNOWLEDGE_DIRECTORY,

    indexFile:
      KNOWLEDGE_INDEX_FILE,

    files:
      indexedFiles,
  };
}


export async function searchKnowledgeBase(
  query: string,
  limit = 4,
): Promise<
  RetrievedKnowledgeChunk[]
> {
  const search =
    await searchKnowledgeBaseWithDiagnostics(
      query,
      limit,
    );

  return search.results;
}


function rankKnowledgeChunks(
  index: KnowledgeIndex,
  query: string,
  queryVector: number[],
  limit: number,
) {
  const queryCodes =
    extractRejectionCodes(
      query,
    );

  const queryIntent =
    detectKnowledgeIntent(
      query,
    );

  const queryCategory =
    inferQueryCategory(
      query,
    );

  const queryTokens =
    tokenize(
      query,
    );


  const candidates:
    ScoredKnowledgeChunk[] =
      index.chunks.map(
        (chunk) => {
          const searchableText =
            chunk.searchText ??
            `${chunk.title}\n${chunk.excerpt}\n${chunk.content}`;

          const semanticScore =
            cosineSimilarity(
              queryVector,
              chunk.embedding,
            );

          const lexicalScore =
            lexicalSimilarity(
              query,
              searchableText,
            );

          const codeAdjustment =
            getCodeAdjustment(
              queryCodes,
              searchableText,
            );

          const titleIntent =
            detectKnowledgeIntent(
              chunk.title,
            );

          const intentAdjustment =
            getIntentAdjustment(
              queryIntent,
              titleIntent,
            );

          const categoryAdjustment =
            getCategoryAdjustment(
              queryCategory,
              chunk.category,
              lexicalScore,
              queryIntent,
              titleIntent,
            );


          return {
            id:
              chunk.id,

            title:
              chunk.title,

            excerpt:
              chunk.excerpt,

            content:
              chunk.content,

            category:
              chunk.category,

            source:
              chunk.source,

            semanticScore,

            lexicalScore,

            codeAdjustment,

            intentAdjustment,

            categoryAdjustment,

            titleIntent,

            searchableText,

            score:
              semanticScore *
                0.72 +
              lexicalScore *
                0.28 +
              codeAdjustment +
              intentAdjustment +
              categoryAdjustment,

            decision:
              "below-minimum-score",
          };
        },
      );


  const minimumCandidates =
    candidates
      .filter(
        (candidate) =>
          candidate.score >=
          MINIMUM_RELEVANCE_SCORE,
      )
      .sort(
        (
          left,
          right,
        ) =>
          right.score -
          left.score,
      );


  const bestScore =
    minimumCandidates[0]
      ?.score;


  const relativeScoreFloor =
    bestScore
      ? bestScore *
        RELATIVE_RELEVANCE_RATIO
      : null;


  const relativeCandidates =
    minimumCandidates.filter(
      (candidate) => {
        const approved =
          relativeScoreFloor === null ||
          candidate.score >=
            relativeScoreFloor;

        candidate.decision =
          approved
            ? "approved"
            : "below-relative-score";

        return approved;
      },
    );


  const results:
    ScoredKnowledgeChunk[] =
      [];


  for (
    const candidate
    of relativeCandidates
  ) {
    if (
      results.length >=
      Math.max(
        0,
        limit,
      )
    ) {
      candidate.decision =
        "limit-reached";

      continue;
    }

    if (
      results.some(
        (selected) =>
          isNearDuplicate(
            candidate,
            selected,
          ),
      )
    ) {
      candidate.decision =
        "near-duplicate";

      continue;
    }

    results.push(
      candidate,
    );
  }


  return {
    results:
      results.map(
        ({
          semanticScore:
            _semanticScore,

          lexicalScore:
            _lexicalScore,

          codeAdjustment:
            _codeAdjustment,

          intentAdjustment:
            _intentAdjustment,

          categoryAdjustment:
            _categoryAdjustment,

          titleIntent:
            _titleIntent,

          searchableText:
            _searchableText,

          decision:
            _decision,

          ...chunk
        }) =>
          chunk,
      ),

    diagnostic: {
      query,

      queryIntent,

      queryCategory,

      queryTokens,

      minimumScore:
        MINIMUM_RELEVANCE_SCORE,

      relativeScoreFloor,

      entries:
        candidates
          .sort(
            (
              left,
              right,
            ) =>
              right.score -
              left.score,
          )
          .map(
            ({
              searchableText:
                _searchableText,

              ...candidate
            }) =>
              candidate,
          ),
    } satisfies KnowledgeSearchDiagnostic,
  };
}


async function searchKnowledgeBaseWithDiagnostics(
  query: string,
  limit = 4,
) {
  const normalizedQuery =
    normalizeWhitespace(
      query,
    );


  if (!normalizedQuery) {
    return {
      results:
        [] as RetrievedKnowledgeChunk[],

      diagnostic: {
        query,

        queryIntent:
          detectKnowledgeIntent(
            query,
          ),

        queryCategory:
          inferQueryCategory(
            query,
          ),

        queryTokens:
          tokenize(
            query,
          ),

        minimumScore:
          MINIMUM_RELEVANCE_SCORE,

        relativeScoreFloor:
          null,

        entries: [],
      } satisfies KnowledgeSearchDiagnostic,
    };
  }


  const index =
    await readKnowledgeIndex();


  if (!index) {
    const knowledgeFiles =
      await listKnowledgeFiles()
        .catch(
          () => [],
        );

    if (
      knowledgeFiles.length > 0
    ) {
      throw new Error(
        "A base de conhecimento ainda nao foi indexada. Execute npm run index:knowledge antes de usar o agente.",
      );
    }


    return {
      results:
        [] as RetrievedKnowledgeChunk[],

      diagnostic: {
        query:
          normalizedQuery,

        queryIntent:
          detectKnowledgeIntent(
            normalizedQuery,
          ),

        queryCategory:
          inferQueryCategory(
            normalizedQuery,
          ),

        queryTokens:
          tokenize(
            normalizedQuery,
          ),

        minimumScore:
          MINIMUM_RELEVANCE_SCORE,

        relativeScoreFloor:
          null,

        entries: [],
      } satisfies KnowledgeSearchDiagnostic,
    };
  }


  if (
    index.chunks.length === 0
  ) {
    return {
      results:
        [] as RetrievedKnowledgeChunk[],

      diagnostic: {
        query:
          normalizedQuery,

        queryIntent:
          detectKnowledgeIntent(
            normalizedQuery,
          ),

        queryCategory:
          inferQueryCategory(
            normalizedQuery,
          ),

        queryTokens:
          tokenize(
            normalizedQuery,
          ),

        minimumScore:
          MINIMUM_RELEVANCE_SCORE,

        relativeScoreFloor:
          null,

        entries: [],
      } satisfies KnowledgeSearchDiagnostic,
    };
  }


  const queryEmbedding =
    await createEmbeddings([
      normalizedQuery,
    ]);


  const queryVector =
    queryEmbedding[0];


  return rankKnowledgeChunks(
    index,
    normalizedQuery,
    queryVector,
    limit,
  );
}


export async function diagnoseKnowledgeSearch(
  query: string,
  limit = 4,
): Promise<KnowledgeSearchDiagnostic> {
  const search =
    await searchKnowledgeBaseWithDiagnostics(
      query,
      limit,
    );

  return search.diagnostic;
}
