import { env } from "@/lib/env";
import { getOpenAiClient } from "@/lib/openai";
import type {
  ChatCitation,
  ChatMessageRecord,
  RetrievedKnowledgeChunk,
} from "@/types";

interface AgentContext {
  prompt: string;
  history: ChatMessageRecord[];
  relatedDocuments: RetrievedKnowledgeChunk[];
}

interface AgentResponse {
  content: string;
  confidence: number;
  citations: ChatCitation[];
}

const AGENT_INSTRUCTIONS = `
Voce e um especialista no ERP utilizado no TCC.
Responda duvidas sobre NF-e, NFS-e, NFC-e, estoque, inventario, financeiro, PCP e procedimentos do sistema.
Use somente as informacoes encontradas na base de conhecimento.
Se nao encontrar informacao suficiente, diga exatamente: "Nao possuo dados suficientes na base de conhecimento para responder com seguranca."
Nao invente funcionalidades, menus ou solucoes.
Responda em portugues do Brasil.
Quando possivel, organize a resposta em passo a passo.
Quando identificar um erro do sistema, retorne neste formato:
Problema:
Possivel causa:
Solucao:
`;

function buildCitations(
  relatedDocuments: RetrievedKnowledgeChunk[],
): ChatCitation[] {
  return relatedDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      category: document.category,
      excerpt: document.excerpt,
      kind: "knowledge",
      source: document.source,
    }));
}

function buildInsufficientResponse(): AgentResponse {
  return {
    content:
      "Nao possuo dados suficientes na base de conhecimento para responder com seguranca.",
    confidence: 18,
    citations: [],
  };
}

function buildConfidence(relatedDocuments: RetrievedKnowledgeChunk[]) {
  const topScore = relatedDocuments[0]?.score ?? 0;
  return Math.max(35, Math.min(98, Math.round(topScore * 100)));
}

export class IntelixSupportAgent {
  async respond(context: AgentContext): Promise<AgentResponse> {
    if (context.relatedDocuments.length === 0) {
      return buildInsufficientResponse();
    }

    const client = getOpenAiClient();
    const history = context.history
      .slice(-6)
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const documents = context.relatedDocuments
      .map(
        (document, index) =>
          `${index + 1}. ${document.title} [${document.category}] (${document.source})\n${document.content}`,
      )
      .join("\n");

    try {
      const response = await client.responses.create({
        model: env.openAiModel,
        instructions: AGENT_INSTRUCTIONS,
        input: `Pergunta atual:\n${context.prompt}\n\nHistorico recente:\n${history || "Sem historico"}\n\nTrechos recuperados da base de conhecimento:\n${documents}`,
        truncation: "auto",
      });

      const content = response.output_text?.trim();

      if (!content) {
        throw new Error("A OpenAI nao retornou texto para a resposta.");
      }

      return {
        content,
        confidence: buildConfidence(context.relatedDocuments),
        citations: buildCitations(context.relatedDocuments),
      };
    } catch {
      throw new Error("Nao foi possivel consultar a OpenAI no momento.");
    }
  }
}
