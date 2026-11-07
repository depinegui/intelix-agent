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
  confidence?: number;
  needsClarification?: boolean;
  citations: ChatCitation[];
}


const INSUFFICIENT_RESPONSE =
  "Não encontrei informações suficientes para responder com segurança. Você pode fornecer mais detalhes ou encaminhar para atendimento.";


// O RAG possui um piso mais permissivo para recuperar candidatos,
// mas o agente exige um contexto mais forte antes de produzir
// uma resposta final.
//
// Esse valor deve ser ajustado com os testes reais da Microsys.
// Consultas curtas e diretas, como "ajuda com markup", podem recuperar uma
// fonte com correspondência lexical exata um pouco abaixo de 0,60. O piso de
// 0,55 continua acima do filtro do RAG e permite que o agente avalie esse
// contexto antes de decidir se ele sustenta uma resposta.
export const MINIMUM_CONTEXT_SCORE = 0.55;


const AGENT_INSTRUCTIONS = `
Você é o Intelix Agent, especialista no ERP utilizado neste projeto.

Sua função é responder exclusivamente com base nos trechos recuperados da base de conhecimento fornecidos junto com a pergunta.

REGRAS OBRIGATÓRIAS:

1. Use somente informações explicitamente sustentadas pelos trechos recuperados da base de conhecimento.

2. Não use conhecimento geral, memória própria, suposições ou informações externas para completar uma resposta.

3. O histórico recente da conversa serve apenas para compreender o contexto da pergunta atual. O histórico não deve ser considerado fonte técnica confiável.

4. Não invente:
- funcionalidades;
- menus;
- caminhos do sistema;
- configurações;
- parâmetros;
- mensagens de erro;
- causas;
- soluções;
- procedimentos;
- regras fiscais;
- valores;
- comandos;
- scripts.

5. Se os trechos recuperados não forem suficientes para responder diretamente e com segurança a pergunta atual, responda exatamente:

"${INSUFFICIENT_RESPONSE}"

6. Se os trechos responderem apenas parte da pergunta, responda somente a parte sustentada pela base. Não complete as partes ausentes por inferência.

7. Se a pergunta usar um termo específico que não esteja sustentado pelos trechos recuperados, não substitua esse termo por outro apenas porque parece semelhante.

Exemplo:
Se a pergunta for sobre "botão de vendas" e a base falar somente sobre "cor do status do pedido", não trate essas duas coisas como equivalentes.

8. Em caso de informações conflitantes ou ambíguas nos trechos, não escolha uma delas por conta própria. Responda exatamente:

"${INSUFFICIENT_RESPONSE}"

9. Responda em português do Brasil.

10. Quando a base fornecer um procedimento, organize a resposta de forma clara e, quando apropriado, em passo a passo.

11. Quando a base identificar claramente um erro, organize a resposta preferencialmente neste formato:

Problema:
Possível causa:
Solução:

12. Preserve nomes técnicos, nomes de telas, configurações, parâmetros e comandos conforme sustentados pela base.

13. Se o usuário mencionar um erro sem informar a mensagem ou a etapa, apresente as verificações pertinentes sustentadas pelos trechos e peça o detalhe necessário para identificar a causa.

Seu objetivo principal é fornecer uma resposta fundamentada. É melhor informar que não há dados suficientes do que produzir uma resposta possivelmente incorreta.
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
    content: INSUFFICIENT_RESPONSE,
    confidence: 18,
    citations: [],
  };
}


function hasReliableContext(
  relatedDocuments: RetrievedKnowledgeChunk[],
) {
  if (relatedDocuments.length === 0) {
    return false;
  }

  const topScore =
    relatedDocuments[0]?.score ?? 0;

  return topScore >= MINIMUM_CONTEXT_SCORE;
}


function buildConfidence(
  relatedDocuments: RetrievedKnowledgeChunk[],
) {
  const topScore =
    relatedDocuments[0]?.score ?? 0;

  return Math.max(
    35,
    Math.min(
      98,
      Math.round(topScore * 100),
    ),
  );
}


function normalizeForComparison(
  content: string,
) {
  return content
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function isInsufficientAnswer(
  content: string,
) {
  const normalizedContent =
    normalizeForComparison(content);

  const normalizedExpected =
    normalizeForComparison(
      INSUFFICIENT_RESPONSE,
    );

  return (
    normalizedContent === normalizedExpected ||
    normalizedContent.startsWith(normalizedExpected)
  );
}


export function needsPromptClarification(prompt: string) {
  const normalized = prompt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Match only generic messages; short technical questions still use the base.
  return !normalized || /^(?:(?:oi|ola|opa|hello|bom dia|boa tarde|boa noite)(?: tudo bem)?|tudo bem|teste(?: de (?:chat|envio|mensagem))?|testando|testando [123](?: [123])*|ajuda|me ajuda|preciso de ajuda|pode me ajudar|socorro)$/.test(normalized);
}

export class IntelixSupportAgent {
  async respond(
    context: AgentContext,
  ): Promise<AgentResponse> {
    if (needsPromptClarification(context.prompt)) {
      return {
        content: "Olá! Como posso ajudar? Descreva sua dúvida ou o erro que está acontecendo.",
        citations: [],
        needsClarification: true,
      };
    }

    // Barreira 1:
    // nenhum contexto foi recuperado.
    if (
      context.relatedDocuments.length === 0
    ) {
      return buildInsufficientResponse();
    }

    // Barreira 2:
    // existe algum resultado, mas o melhor
    // trecho ainda nao possui score suficiente
    // para sustentar uma resposta final.
    if (
      !hasReliableContext(
        context.relatedDocuments,
      )
    ) {
      return buildInsufficientResponse();
    }


    const client =
      getOpenAiClient();


    const history =
      context.history
        .slice(-6)
        .map(
          (message) =>
            `${message.role}: ${message.content}`,
        )
        .join("\n");


    const documents =
      context.relatedDocuments
        .map(
          (
            document,
            index,
          ) =>
            [
              `TRECHO ${index + 1}`,
              `Título: ${document.title}`,
              `Categoria: ${document.category}`,
              `Fonte: ${document.source}`,
              `Score de recuperação: ${document.score.toFixed(4)}`,
              "",
              document.content,
            ].join("\n"),
        )
        .join(
          "\n\n--------------------\n\n",
        );


    try {
      const response =
        await client.responses.create({
          model:
            env.openAiModel,

          instructions:
            AGENT_INSTRUCTIONS,

          input: [
            "PERGUNTA ATUAL:",
            context.prompt,

            "",
            "HISTÓRICO RECENTE:",
            history ||
              "Sem histórico.",

            "",
            "IMPORTANTE:",
            "O histórico acima não é fonte técnica. Use-o somente para compreender a conversa.",

            "",
            "TRECHOS RECUPERADOS DA BASE DE CONHECIMENTO:",
            documents,

            "",
            "Responda somente com informações sustentadas pelos trechos acima.",
          ].join("\n"),

          truncation: "auto",
        });


      const content =
        response.output_text?.trim();


      if (!content) {
        throw new Error(
          "A OpenAI não retornou texto para a resposta.",
        );
      }


      // Barreira 3:
      // se o próprio modelo concluir que a base
      // não sustenta uma resposta, convertemos
      // para o fallback oficial do sistema.
      //
      // Assim também evitamos registrar fontes
      // como se elas sustentassem uma resposta.
      if (
        isInsufficientAnswer(
          content,
        )
      ) {
        return buildInsufficientResponse();
      }


      return {
        content,

        confidence:
          buildConfidence(
            context.relatedDocuments,
          ),

        citations:
          buildCitations(
            context.relatedDocuments,
          ),
      };
    } catch {
      throw new Error(
        "Não foi possível consultar a OpenAI no momento.",
      );
    }
  }
}
