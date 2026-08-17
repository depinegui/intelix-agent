import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { OPENAI_EMBEDDING_MODEL, getOpenAiClient } from "@/lib/openai";
import type { KnowledgeCategory, RetrievedKnowledgeChunk } from "@/types";

const KNOWLEDGE_DIRECTORY = path.join(process.cwd(), "knowledge");
const KNOWLEDGE_INDEX_DIRECTORY = path.join(KNOWLEDGE_DIRECTORY, ".index");
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
const MINIMUM_RELEVANCE_SCORE = 0.32;
const EMBEDDING_BATCH_SIZE = 50;

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
  searchText: z.string().optional(),
  embedding: z.array(z.number()),
});

const indexedFileSchema = z.object({
  source: z.string(),
  checksum: z.string(),
  chunks: z.number().int().nonnegative(),
  recordsFound: z.number().int().nonnegative().optional(),
  recordsIndexed: z.number().int().nonnegative().optional(),
});

const knowledgeIndexSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string(),
  embeddingModel: z.string(),
  knowledgeDirectory: z.string(),
  files: z.array(indexedFileSchema),
  chunks: z.array(indexedChunkSchema),
});

type IndexedChunk = z.infer<typeof indexedChunkSchema>;
type KnowledgeIndex = z.infer<typeof knowledgeIndexSchema>;

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
}

let cachedIndex: KnowledgeIndex | null = null;
let cachedIndexVersion = "";

function normalizeWhitespace(input: string) {
  return input.replace(/\r/g, "").replace(/\t/g, " ").replace(/\u0000/g, " ").trim();
}

function normalizeForSearch(input: string) {
  return normalizeWhitespace(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(input: string) {
  return normalizeForSearch(input)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function normalizeSpreadsheetHeader(input: string) {
  return normalizeForSearch(input).replace(/[^a-z0-9]/g, "");
}

function normalizeSpreadsheetValue(value: unknown) {
  return normalizeWhitespace(String(value ?? ""));
}

function dedupeStrings(values: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = normalizeWhitespace(value);

    if (!trimmed) {
      continue;
    }

    const key = normalizeForSearch(trimmed);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

function splitQuestionVariations(input: string) {
  const normalized = normalizeWhitespace(input);

  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*;\s*/))
    .flatMap((line) => line.match(/[^?]+(?:\?|$)/g) ?? [line])
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.endsWith("?") ? line : line.replace(/[.]+$/, "").trim()));

  return dedupeStrings(lines);
}

function createChunkId(source: string, content: string, index: number) {
  return crypto
    .createHash("sha1")
    .update(`${source}:${index}:${content}`)
    .digest("hex");
}

function createExcerpt(content: string) {
  const normalized = normalizeWhitespace(content).replace(/\n+/g, " ");
  return normalized.length > 220
    ? `${normalized.slice(0, 217).trimEnd()}...`
    : normalized;
}

function inferCategory(content: string, source: string): KnowledgeCategory {
  const searchable = normalizeForSearch(`${source} ${content}`);

  if (
    searchable.includes("nf-e") ||
    searchable.includes(" nfe ") ||
    searchable.includes("sefaz") ||
    searchable.includes("nota fiscal")
  ) {
    return "NF_E";
  }

  if (searchable.includes("nfc-e") || searchable.includes(" pdv ")) {
    return "NFC_E";
  }

  if (searchable.includes("estoque") || searchable.includes("saldo")) {
    return "ESTOQUE";
  }

  if (searchable.includes("inventario") || searchable.includes("contagem")) {
    return "INVENTARIO";
  }

  if (searchable.includes("pcp") || searchable.includes("produc")) {
    return "PCP";
  }

  return "PROCEDIMENTOS";
}

function extractTitle(content: string, source: string) {
  const lines = normalizeWhitespace(content)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const heading = lines.find((line) => line.startsWith("#"));

  if (heading) {
    return heading.replace(/^#+\s*/, "").trim();
  }

  return path
    .basename(source, path.extname(source))
    .replace(/[-_]/g, " ")
    .trim();
}

function splitLongSegment(segment: string) {
  const parts: string[] = [];
  let cursor = 0;

  while (cursor < segment.length) {
    const nextCursor = Math.min(cursor + CHUNK_SIZE, segment.length);
    const slice = segment.slice(cursor, nextCursor).trim();

    if (slice) {
      parts.push(slice);
    }

    if (nextCursor >= segment.length) {
      break;
    }

    cursor = Math.max(nextCursor - CHUNK_OVERLAP, cursor + 1);
  }

  return parts;
}

function chunkDocument(content: string) {
  const paragraphs = normalizeWhitespace(content)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > CHUNK_SIZE) {
      if (buffer) {
        chunks.push(buffer.trim());
        buffer = "";
      }

      chunks.push(...splitLongSegment(paragraph));
      continue;
    }

    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (candidate.length <= CHUNK_SIZE) {
      buffer = candidate;
      continue;
    }

    if (buffer) {
      chunks.push(buffer.trim());
    }

    buffer = paragraph;
  }

  if (buffer) {
    chunks.push(buffer.trim());
  }

  return chunks;
}

function cosineSimilarity(left: number[], right: number[]) {
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function lexicalSimilarity(query: string, searchableText: string) {
  const queryTokens = new Set(tokenize(query));
  const contentTokens = new Set(tokenize(searchableText));

  if (queryTokens.size === 0 || contentTokens.size === 0) {
    return 0;
  }

  let matches = 0;

  for (const token of queryTokens) {
    if (contentTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / queryTokens.size;
}

function exactCodeBoost(query: string, searchableText: string) {
  const queryCodes = query.match(/\b\d{3,}\b/g) ?? [];

  if (queryCodes.length === 0) {
    return 0;
  }

  return queryCodes.some((code) => searchableText.includes(code)) ? 0.2 : 0;
}

function createIndexedChunk(params: {
  content: string;
  title: string;
  source: string;
  index: number;
  excerpt?: string;
  searchText?: string;
  categoryHint?: string;
}): RawChunk {
  const searchText = normalizeWhitespace(
    params.searchText ?? `${params.title}\n${params.content}`,
  );
  const content = normalizeWhitespace(params.content);

  return {
    id: createChunkId(params.source, searchText, params.index),
    title: normalizeWhitespace(params.title),
    excerpt: createExcerpt(params.excerpt ?? content),
    content,
    category: inferCategory(
      `${params.categoryHint ?? ""}\n${searchText}\n${content}`,
      params.source,
    ),
    source: params.source,
    searchText,
  };
}

function createGenericChunksFromText(
  rawText: string,
  relativeSource: string,
): RawChunk[] {
  const title = extractTitle(rawText, relativeSource);

  return chunkDocument(rawText).map((chunk, index) =>
    createIndexedChunk({
      content: chunk,
      title,
      source: relativeSource,
      index,
    }),
  );
}

function getSpreadsheetCell(
  row: Record<string, unknown>,
  expectedHeaders: string[],
) {
  const expected = new Set(expectedHeaders.map(normalizeSpreadsheetHeader));

  for (const [header, value] of Object.entries(row)) {
    if (expected.has(normalizeSpreadsheetHeader(header))) {
      return normalizeSpreadsheetValue(value);
    }
  }

  return "";
}

function buildSpreadsheetRow(
  row: Record<string, unknown>,
  sheetName: string,
  rowNumber: number,
): SpreadsheetKnowledgeRow | null {
  const primaryQuestion = getSpreadsheetCell(row, ["Pergunta Principal"]);
  const answer = getSpreadsheetCell(row, ["Resposta"]);
  const variationText = getSpreadsheetCell(row, ["Variações da Pergunta"]);
  const categoryHint = getSpreadsheetCell(row, [
    "Tópico/Categoria",
    "Categoria/Tópico",
  ]);
  const userIntent = getSpreadsheetCell(row, ["Intenção do Usuário"]);
  const software = getSpreadsheetCell(row, ["Software"]);
  const sourceLabel = getSpreadsheetCell(row, ["Fonte da Informação", "Fonte"]);
  const status = getSpreadsheetCell(row, ["Status (Revisado/Aprovado)", "Status"]);
  const notes = getSpreadsheetCell(row, ["Observações/Notas", "Observações"]);

  if (!primaryQuestion && !answer) {
    return null;
  }

  return {
    primaryQuestion,
    answer,
    variations: splitQuestionVariations(variationText),
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

function formatBulletList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function createSpreadsheetChunk(
  row: SpreadsheetKnowledgeRow,
  relativeSource: string,
): RawChunk | null {
  if (!row.primaryQuestion || !row.answer) {
    return null;
  }

  const variations = dedupeStrings([
    row.primaryQuestion,
    ...row.variations,
  ]);

  const contentSections = [
    "Resposta principal:",
    row.answer,
    `Pergunta principal: ${row.primaryQuestion}`,
    variations.length > 1
      ? `Variacoes da pergunta:\n${formatBulletList(
          variations.filter((variation) => variation !== row.primaryQuestion),
        )}`
      : "",
    row.categoryHint ? `Categoria/Tópico: ${row.categoryHint}` : "",
    row.userIntent ? `Intencao do usuario: ${row.userIntent}` : "",
    row.software ? `Software: ${row.software}` : "",
    row.sourceLabel ? `Fonte: ${row.sourceLabel}` : "",
    row.status ? `Status: ${row.status}` : "",
    row.notes ? `Observacoes: ${row.notes}` : "",
  ].filter(Boolean);

  const searchText = [
    row.primaryQuestion,
    variations.join("\n"),
    row.categoryHint,
    row.userIntent,
    row.software,
    row.answer,
  ]
    .filter(Boolean)
    .join("\n");

  const rowSource = `${relativeSource}#${row.sheetName}-linha-${row.rowNumber}`;

  return createIndexedChunk({
    content: contentSections.join("\n\n"),
    title: row.primaryQuestion,
    source: rowSource,
    index: row.rowNumber,
    excerpt: row.answer,
    searchText,
    categoryHint: row.categoryHint,
  });
}

async function ensureKnowledgeDirectory() {
  await fs.mkdir(KNOWLEDGE_DIRECTORY, { recursive: true });
}

async function listKnowledgeFiles(directory = KNOWLEDGE_DIRECTORY) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listKnowledgeFiles(absolutePath)));
      continue;
    }

    if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

async function extractRawTextFromFile(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".txt" || extension === ".md" || extension === ".csv") {
    return normalizeWhitespace(await fs.readFile(filePath, "utf8"));
  }

  if (extension === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const content = await fs.readFile(filePath);
    const parser = new PDFParse({ data: content });
    const result = await parser.getText();
    await parser.destroy();
    return normalizeWhitespace(result.text);
  }

  if (extension === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeWhitespace(result.value);
  }

  return "";
}

async function extractSpreadsheetKnowledge(
  filePath: string,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const fileBuffer = await fs.readFile(filePath);
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

      if (!parsedRow) {
        return;
      }

      recordsFound += 1;

      const chunk = createSpreadsheetChunk(parsedRow, relativeSource);

      if (!chunk) {
        return;
      }

      recordsIndexed += 1;
      chunks.push(chunk);
    });
  }

  return {
    checksum,
    chunks,
    recordsFound,
    recordsIndexed,
  };
}

async function extractKnowledgeFile(
  filePath: string,
  relativeSource: string,
): Promise<ExtractedKnowledgeFile> {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".xlsx") {
    return extractSpreadsheetKnowledge(filePath, relativeSource);
  }

  const fileBuffer = await fs.readFile(filePath);
  const checksum = crypto.createHash("sha1").update(fileBuffer).digest("hex");
  const rawText = await extractRawTextFromFile(filePath);

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
    chunks: createGenericChunksFromText(rawText, relativeSource),
    recordsFound: 1,
    recordsIndexed: 1,
  };
}

async function createEmbeddings(input: string[]) {
  const client = getOpenAiClient();
  const embeddings: number[][] = [];

  for (let index = 0; index < input.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = input.slice(index, index + EMBEDDING_BATCH_SIZE);
    const response = await client.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: batch,
    });

    embeddings.push(...response.data.map((item) => item.embedding));
  }

  return embeddings;
}

async function readKnowledgeIndex() {
  try {
    const stats = await fs.stat(KNOWLEDGE_INDEX_FILE);
    const cacheKey = `${stats.mtimeMs}:${stats.size}`;

    if (cachedIndex && cachedIndexVersion === cacheKey) {
      return cachedIndex;
    }

    const raw = await fs.readFile(KNOWLEDGE_INDEX_FILE, "utf8");
    const parsed = knowledgeIndexSchema.parse(JSON.parse(raw));
    cachedIndex = parsed;
    cachedIndexVersion = cacheKey;

    return parsed;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export function getKnowledgePaths() {
  return {
    knowledgeDirectory: KNOWLEDGE_DIRECTORY,
    indexFile: KNOWLEDGE_INDEX_FILE,
  };
}

export async function hasIndexedKnowledgeBase() {
  return (await readKnowledgeIndex()) !== null;
}

export async function indexKnowledgeBase(): Promise<KnowledgeIndexingResult> {
  await ensureKnowledgeDirectory();

  const knowledgeFiles = await listKnowledgeFiles();

  if (knowledgeFiles.length === 0) {
    throw new Error(
      "Nenhum arquivo suportado foi encontrado na pasta /knowledge. Adicione arquivos .txt, .md, .pdf, .docx, .csv ou .xlsx antes de indexar.",
    );
  }

  const chunkDrafts: RawChunk[] = [];
  const indexedFiles: IndexedFileSummary[] = [];

  for (const filePath of knowledgeFiles) {
    const relativeSource = path.relative(KNOWLEDGE_DIRECTORY, filePath);
    const extracted = await extractKnowledgeFile(filePath, relativeSource);

    chunkDrafts.push(...extracted.chunks);
    indexedFiles.push({
      source: relativeSource,
      checksum: extracted.checksum,
      chunks: extracted.chunks.length,
      recordsFound: extracted.recordsFound,
      recordsIndexed: extracted.recordsIndexed,
    });
  }

  if (chunkDrafts.length === 0) {
    throw new Error(
      "Nao foi possivel extrair conteudo textual dos arquivos encontrados na pasta /knowledge.",
    );
  }

  const embeddings = await createEmbeddings(
    chunkDrafts.map((chunk) => chunk.searchText),
  );

  const chunks: IndexedChunk[] = chunkDrafts.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));

  const index: KnowledgeIndex = {
    version: 2,
    generatedAt: new Date().toISOString(),
    embeddingModel: OPENAI_EMBEDDING_MODEL,
    knowledgeDirectory: KNOWLEDGE_DIRECTORY,
    files: indexedFiles,
    chunks,
  };

  await fs.mkdir(KNOWLEDGE_INDEX_DIRECTORY, { recursive: true });
  await fs.writeFile(KNOWLEDGE_INDEX_FILE, JSON.stringify(index, null, 2), "utf8");

  cachedIndex = index;
  cachedIndexVersion = "";

  return {
    filesProcessed: indexedFiles.length,
    chunksIndexed: chunks.length,
    recordsFound: indexedFiles.reduce(
      (total, fileSummary) => total + fileSummary.recordsFound,
      0,
    ),
    recordsIndexed: indexedFiles.reduce(
      (total, fileSummary) => total + fileSummary.recordsIndexed,
      0,
    ),
    knowledgeDirectory: KNOWLEDGE_DIRECTORY,
    indexFile: KNOWLEDGE_INDEX_FILE,
    files: indexedFiles,
  };
}

export async function searchKnowledgeBase(
  query: string,
  limit = 4,
): Promise<RetrievedKnowledgeChunk[]> {
  const normalizedQuery = normalizeWhitespace(query);

  if (!normalizedQuery) {
    return [];
  }

  const index = await readKnowledgeIndex();

  if (!index) {
    const knowledgeFiles = await listKnowledgeFiles().catch(() => []);

    if (knowledgeFiles.length > 0) {
      throw new Error(
        "A base de conhecimento ainda nao foi indexada. Execute npm run index:knowledge antes de usar o agente.",
      );
    }

    return [];
  }

  if (index.chunks.length === 0) {
    return [];
  }

  const queryEmbedding = await createEmbeddings([normalizedQuery]);
  const queryVector = queryEmbedding[0];

  return index.chunks
    .map((chunk) => {
      const searchableText =
        chunk.searchText ?? `${chunk.title}\n${chunk.excerpt}\n${chunk.content}`;
      const semanticScore = cosineSimilarity(queryVector, chunk.embedding);
      const lexicalScore = lexicalSimilarity(normalizedQuery, searchableText);
      const codeBoost = exactCodeBoost(normalizedQuery, searchableText);
      const score = semanticScore * 0.72 + lexicalScore * 0.28 + codeBoost;

      return {
        id: chunk.id,
        title: chunk.title,
        excerpt: chunk.excerpt,
        content: chunk.content,
        category: chunk.category,
        source: chunk.source,
        score,
      };
    })
    .filter((chunk) => chunk.score >= MINIMUM_RELEVANCE_SCORE)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
