export type CompanyType = "FISICA" | "JURIDICA";
export type UserRole = "ADMIN" | "ANALYST" | "SPECIALIST";
export type TicketCategory =
  | "NF_E"
  | "NFC_E"
  | "ESTOQUE"
  | "INVENTARIO"
  | "PCP"
  | "FINANCEIRO";
export type TicketStatus =
  | "ABERTO"
  | "EM_TRIAGEM"
  | "EM_ANDAMENTO"
  | "IA_RESOLVIDO"
  | "ESCALADO"
  | "FECHADO";
export type TicketPriority = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type KnowledgeCategory =
  | "NF_E"
  | "NFC_E"
  | "ESTOQUE"
  | "INVENTARIO"
  | "PCP"
  | "PROCEDIMENTOS";
export type MessageRole = "USER" | "ASSISTANT" | "SYSTEM";
export type MessageFeedback = "HELPFUL" | "NOT_HELPFUL";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  document: string;
  phone: string;
  companyType: CompanyType;
  role: UserRole;
}

export interface DemoUserRecord extends SessionUser {
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  actorName: string;
  action: string;
  note?: string;
  createdAt: string;
}

export interface TicketRecord {
  id: string;
  protocol: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  requesterName: string;
  aiSummary?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  histories: TicketHistoryEntry[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeHighlight {
  category: KnowledgeCategory;
  label: string;
  documents: number;
  items: string[];
}

export interface KnowledgeOverviewStats {
  ragAccuracy: string;
  averageResponse: string;
}

export interface ChatCitation {
  id: string;
  title: string;
  category: KnowledgeCategory | TicketCategory;
  excerpt: string;
  kind: "knowledge" | "ticket";
  source?: string;
}

export interface RetrievedKnowledgeChunk {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: KnowledgeCategory;
  source: string;
  score: number;
}

export interface ChatConversationRecord {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  confidence?: number;
  citations?: ChatCitation[];
  responseTimeMs?: number;
  retrievedSourcesCount?: number;
  withoutContext?: boolean;
  feedback?: MessageFeedback;
  createdAt: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}

export interface DashboardSnapshot {
  metrics: DashboardMetric[];
  indexedDocs: number;
  resolutionRate: number;
  handoffRate: number;
  averageAiResponseTimeMs: number | null;
  contextCoverageRate: number | null;
  helpfulFeedbackRate: number | null;
  averageSourcesPerResponse: number | null;
  weeklyVolume: Array<{
    day: string;
    total: number;
    assisted: number;
    escalated: number;
  }>;
  weeklyPeakLabel: string;
  recentTickets: TicketRecord[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  document: string;
  phone: string;
  companyType: CompanyType;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface RecoveryInput {
  email: string;
  password: string;
}

export interface TicketInput {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  protocol?: string;
}

export interface KnowledgeInput {
  title: string;
  excerpt: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
}

export interface ChatReply {
  conversationId: string;
  conversation: ChatConversationRecord;
  userMessage?: ChatMessageRecord;
  message: ChatMessageRecord;
}
