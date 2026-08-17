import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  KnowledgeCategory,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types";

export const statusLabels: Record<TicketStatus, string> = {
  ABERTO: "Aguardando abertura",
  EM_TRIAGEM: "Triagem por IA",
  EM_ANDAMENTO: "Em andamento",
  IA_RESOLVIDO: "Resolvido pela IA",
  ESCALADO: "Encaminhado",
  FECHADO: "Fechado",
};

export const priorityLabels: Record<TicketPriority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Critica",
};

export const categoryLabels: Record<TicketCategory | KnowledgeCategory, string> =
  {
    NF_E: "NF-e",
    NFC_E: "NFC-e",
    ESTOQUE: "Estoque",
    INVENTARIO: "Inventario",
    PCP: "PCP",
    FINANCEIRO: "Financeiro",
    PROCEDIMENTOS: "Procedimentos Internos",
  };

export function formatDateTime(value: string) {
  return format(new Date(value), "dd/MM/yyyy, HH:mm", {
    locale: ptBR,
  });
}

export function formatShortDate(value: string) {
  return format(new Date(value), "dd/MM/yyyy", {
    locale: ptBR,
  });
}

export function formatConversationTime(value: string) {
  return format(new Date(value), "HH:mm", {
    locale: ptBR,
  });
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeIdentifier(value: string) {
  return value.replace(/\D/g, "");
}
