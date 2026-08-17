import { hashSync } from "bcryptjs";
import type {
  ChatConversationRecord,
  ChatMessageRecord,
  DemoUserRecord,
  KnowledgeDocument,
  KnowledgeHighlight,
  TicketRecord,
} from "@/types";
import { slugify } from "@/utils/format";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function buildProtocol(sequence: number) {
  const today = new Date();
  return `INT-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${sequence}`;
}

const demoPasswordHash = hashSync("Intelix@2026", 10);

export const knowledgeHighlights: KnowledgeHighlight[] = [
  {
    category: "NF_E",
    label: "NF-e",
    documents: 196,
    items: ["Emissao de NF-e", "Rejeicoes SEFAZ", "Cancelamento"],
  },
  {
    category: "NFC_E",
    label: "NFC-e",
    documents: 89,
    items: ["Configuracao SAT", "Contingencia", "Homologacao"],
  },
  {
    category: "ESTOQUE",
    label: "Estoque",
    documents: 124,
    items: ["Movimentacao", "Ajustes", "Transferencias"],
  },
  {
    category: "INVENTARIO",
    label: "Inventario",
    documents: 67,
    items: ["Contagem fisica", "Divergencias", "Acuracidade"],
  },
  {
    category: "PCP",
    label: "PCP",
    documents: 92,
    items: ["Ordem de producao", "Planejamento", "Apontamentos"],
  },
  {
    category: "PROCEDIMENTOS",
    label: "Procedimentos Internos",
    documents: 143,
    items: ["Fluxos aprovacao", "Politicas", "Manuais"],
  },
];

export const prototypeDashboard = {
  totalTickets: 127,
  handledToday: 42,
  resolutionRate: 70,
  handoffRate: 30,
  averageMinutes: 8,
  indexedDocs: 671,
  ragAccuracy: 98.7,
};

function createKnowledgeDocument(
  title: string,
  category: KnowledgeDocument["category"],
  excerpt: string,
  content: string,
  tags: string[],
  views: number,
  createdAt: string,
): KnowledgeDocument {
  return {
    id: createId("doc"),
    title,
    slug: slugify(title),
    excerpt,
    content,
    category,
    tags,
    views,
    createdAt,
    updatedAt: createdAt,
  };
}

export const seedKnowledgeDocuments: KnowledgeDocument[] = [
  createKnowledgeDocument(
    "Manual completo de rejeicoes SEFAZ 2026",
    "NF_E",
    "Guia de diagnostico para rejeicoes fiscais com foco em duplicidade de numeracao e validacoes cadastrais.",
    "Rejeicao 539 significa duplicidade de NF-e detectada. Confirme se a chave foi autorizada anteriormente, cancele a nota emitida por engano ou avance a numeracao antes de retransmitir. Sempre valide serie, ambiente e sequencia automatica do ERP.",
    ["sefaz", "rejeicao 539", "duplicidade", "nf-e"],
    89,
    daysAgo(3),
  ),
  createKnowledgeDocument(
    "Procedimento de contingencia NFC-e",
    "NFC_E",
    "Passo a passo para operar em contingencia sem interromper a operacao de loja.",
    "Quando houver indisponibilidade da SEFAZ, habilite emissao offline, registre justificativa interna, mantenha impressao do DANFE e transmita as notas pendentes assim que o servico normalizar.",
    ["nfc-e", "contingencia", "offline"],
    64,
    daysAgo(4),
  ),
  createKnowledgeDocument(
    "Configuracao de inventario rotativo",
    "INVENTARIO",
    "Configuracoes recomendadas para ciclos de contagem, divergencias e saneamento de estoque.",
    "Defina grupos de itens por criticidade, periodos de contagem e regras de tolerancia. Ative bloqueio de movimentacao durante conferencia quando houver divergencia critica e publique ajuste somente com aprovacao.",
    ["inventario", "contagem", "rotativo"],
    41,
    daysAgo(5),
  ),
  createKnowledgeDocument(
    "Fluxo de aprovacao de ordem de producao",
    "PCP",
    "Padrao operacional para abertura, aprovacao e liberacao de ordens de producao.",
    "Valide estrutura, saldo de materiais e capacidade antes da liberacao. Divergencias devem abrir apontamento interno e seguir para aprovacao do coordenador de PCP.",
    ["pcp", "ordem de producao", "aprovacao"],
    142,
    daysAgo(6),
  ),
  createKnowledgeDocument(
    "Ajuste de saldo minimo no estoque",
    "ESTOQUE",
    "Procedimento para recalculo de ponto de pedido e saldo minimo por curva ABC.",
    "Revise historico de consumo, lead time e cobertura desejada. Atualize saldo minimo por familia e execute reprocessamento de sugestoes de compra ao final da alteracao.",
    ["estoque", "saldo minimo", "reposicao"],
    55,
    daysAgo(7),
  ),
  createKnowledgeDocument(
    "Emissao offline e sincronizacao posterior",
    "NFC_E",
    "Boas praticas para notas emitidas fora de linha e posterior sincronizacao fiscal.",
    "Mantenha o certificado valido, o numero da serie alinhado e a fila de sincronizacao monitorada. Em caso de rejeicao, corrija o cadastro e reenvie preservando o protocolo da venda.",
    ["offline", "sincronizacao", "nfc-e"],
    73,
    daysAgo(2),
  ),
];

export const seedUsers: DemoUserRecord[] = [
  {
    id: "usr_admin_demo",
    name: "Marina Costa",
    email: "analista@intelix.ai",
    document: "12.345.678/0001-99",
    phone: "(11) 99999-2211",
    companyType: "JURIDICA",
    role: "ADMIN",
    passwordHash: demoPasswordHash,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
    resetToken: null,
    resetTokenExpiresAt: null,
  },
];

export const seedTickets: TicketRecord[] = [
  {
    id: createId("ticket"),
    protocol: buildProtocol(2087),
    title: "Erro na emissao de NF-e",
    description:
      "Ao transmitir a nota fiscal o sistema retorna rejeicao 539 por duplicidade de NF-e.",
    category: "NF_E",
    status: "IA_RESOLVIDO",
    priority: "ALTA",
    requesterId: seedUsers[0].id,
    requesterName: seedUsers[0].name,
    aiSummary:
      "Possivel duplicidade de numeracao detectada na SEFAZ. Validar nota anterior e serie configurada.",
    resolutionNotes:
      "Cliente orientado a revisar a chave autorizada e ajustar a numeracao da nova emissao.",
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(1),
    histories: [
      {
        id: createId("history"),
        ticketId: "temp",
        actorName: "Intelix Agent",
        action: "Classificou o ticket em triagem por IA.",
        note: "Confianca de 95% para rejeicao SEFAZ conhecida.",
        createdAt: hoursAgo(5),
      },
      {
        id: createId("history"),
        ticketId: "temp",
        actorName: "Marina Costa",
        action: "Confirmou a solucao aplicada.",
        note: "Reemissao efetuada com nova numeracao.",
        createdAt: hoursAgo(1),
      },
    ],
  },
  {
    id: createId("ticket"),
    protocol: buildProtocol(2086),
    title: "Duvida sobre inventario rotativo",
    description:
      "Equipe quer revisar as melhores configuracoes para inventario rotativo por curva ABC.",
    category: "INVENTARIO",
    status: "EM_ANDAMENTO",
    priority: "MEDIA",
    requesterId: seedUsers[0].id,
    requesterName: seedUsers[0].name,
    aiSummary:
      "Base de conhecimento encontrada. Recomendado validar tolerancias de divergencia e calendario.",
    resolutionNotes: "",
    createdAt: hoursAgo(12),
    updatedAt: hoursAgo(3),
    histories: [
      {
        id: createId("history"),
        ticketId: "temp",
        actorName: "Intelix Agent",
        action: "Sugeriu artigo de inventario rotativo.",
        note: "Documentacao enviada ao cliente.",
        createdAt: hoursAgo(11),
      },
    ],
  },
  {
    id: createId("ticket"),
    protocol: buildProtocol(2085),
    title: "Problema no calculo de ICMS",
    description:
      "Aliquota do ICMS nao esta refletindo a tabela fiscal atualizada no modulo de faturamento.",
    category: "FINANCEIRO",
    status: "ESCALADO",
    priority: "CRITICA",
    requesterId: seedUsers[0].id,
    requesterName: seedUsers[0].name,
    aiSummary:
      "Necessario envolvimento do especialista fiscal por impacto tributario e regra customizada.",
    resolutionNotes: "",
    createdAt: hoursAgo(28),
    updatedAt: hoursAgo(8),
    histories: [
      {
        id: createId("history"),
        ticketId: "temp",
        actorName: "Intelix Agent",
        action: "Encaminhou para especialista.",
        note: "Impacto financeiro alto identificado.",
        createdAt: hoursAgo(27),
      },
    ],
  },
  {
    id: createId("ticket"),
    protocol: buildProtocol(2084),
    title: "Configuracao de NFC-e",
    description:
      "PDV novo precisa de apoio para certificado, CSC e contingencia de NFC-e.",
    category: "NFC_E",
    status: "IA_RESOLVIDO",
    priority: "MEDIA",
    requesterId: seedUsers[0].id,
    requesterName: seedUsers[0].name,
    aiSummary:
      "Fluxo conhecido e resolvido com checklist de emissao offline e sincronizacao posterior.",
    resolutionNotes: "",
    createdAt: hoursAgo(38),
    updatedAt: hoursAgo(16),
    histories: [
      {
        id: createId("history"),
        ticketId: "temp",
        actorName: "Intelix Agent",
        action: "Enviou checklist de configuracao.",
        note: "Cliente validou certificado e numero de serie.",
        createdAt: hoursAgo(37),
      },
    ],
  },
];

seedTickets.forEach((ticket) => {
  ticket.histories = ticket.histories.map((history) => ({
    ...history,
    ticketId: ticket.id,
  }));
});

export const seedConversations: ChatConversationRecord[] = [
  {
    id: createId("conv"),
    title: "Duplicidade de NF-e",
    userId: seedUsers[0].id,
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(1),
  },
];

export const seedMessages: ChatMessageRecord[] = [
  {
    id: createId("msg"),
    conversationId: seedConversations[0].id,
    role: "USER",
    content:
      'Estou com erro ao emitir NF-e. Aparece a mensagem "Rejeicao 539".',
    createdAt: hoursAgo(4),
  },
  {
    id: createId("msg"),
    conversationId: seedConversations[0].id,
    role: "ASSISTANT",
    content:
      'Entendi. A rejeicao 539 da SEFAZ indica duplicidade de NF-e. Localizei um procedimento na base e um historico semelhante do cliente. Confira se a nota ja foi autorizada anteriormente, se a numeracao precisa avancar e se a serie configurada no ERP esta correta antes de reenviar.',
    confidence: 95,
    citations: [
      {
        id: seedKnowledgeDocuments[0].id,
        title: seedKnowledgeDocuments[0].title,
        category: seedKnowledgeDocuments[0].category,
        excerpt: seedKnowledgeDocuments[0].excerpt,
        kind: "knowledge",
      },
      {
        id: seedTickets[0].id,
        title: seedTickets[0].title,
        category: seedTickets[0].category,
        excerpt: seedTickets[0].description,
        kind: "ticket",
      },
    ],
    createdAt: hoursAgo(3.8),
  },
];

function createDemoStore() {
  return {
    users: structuredClone(seedUsers),
    tickets: structuredClone(seedTickets),
    knowledge: structuredClone(seedKnowledgeDocuments),
    conversations: structuredClone(seedConversations),
    messages: structuredClone(seedMessages),
    nextTicketSequence: 2088,
  };
}

export type DemoStore = ReturnType<typeof createDemoStore>;

declare global {
  var __intelixDemoStore: DemoStore | undefined;
}

export const demoStore = global.__intelixDemoStore ?? createDemoStore();

if (!global.__intelixDemoStore) {
  global.__intelixDemoStore = demoStore;
}

export function getNextProtocol() {
  const protocol = buildProtocol(demoStore.nextTicketSequence);
  demoStore.nextTicketSequence += 1;
  return protocol;
}
