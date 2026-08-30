import { z } from "zod";
import { demoStore, getNextProtocol } from "@/database/demo-store";
import { prisma } from "@/lib/prisma";
import type {
  SessionUser,
  TicketInput,
  TicketRecord,
  TicketStatus,
} from "@/types";

const ticketSchema = z.object({
  title: z.string().min(6),
  description: z.string().min(12),
  category: z.enum([
    "NF_E",
    "NFC_E",
    "ESTOQUE",
    "INVENTARIO",
    "PCP",
    "FINANCEIRO",
  ]),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
  protocol: z.string().optional(),
});

function serializeTicket(record: {
  id: string;
  protocol: string;
  title: string;
  description: string;
  category: TicketRecord["category"];
  status: TicketRecord["status"];
  priority: TicketRecord["priority"];
  requesterId: string;
  requesterName: string;
  aiSummary: string | null;
  resolutionNotes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  histories: Array<{
    id: string;
    ticketId: string;
    actorName: string;
    action: string;
    note: string | null;
    createdAt: Date | string;
  }>;
}): TicketRecord {
  return {
    ...record,
    aiSummary: record.aiSummary ?? undefined,
    resolutionNotes: record.resolutionNotes ?? undefined,
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
    updatedAt:
      record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : record.updatedAt,
    histories: record.histories.map((history) => ({
      ...history,
      note: history.note ?? undefined,
      createdAt:
        history.createdAt instanceof Date
          ? history.createdAt.toISOString()
          : history.createdAt,
    })),
  };
}

export async function listTickets(limit?: number) {
  if (prisma) {
    const tickets = await prisma.ticket.findMany({
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });

    return tickets.map(serializeTicket);
  }

  return [...demoStore.tickets]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
}

export function getProtocolPreview() {
  const today = new Date();
  return `INT-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-####`;
}

export async function createTicket(input: TicketInput, user: SessionUser) {
  const data = ticketSchema.parse(input);
  const protocol = data.protocol?.trim() || getNextProtocol();
  const now = new Date();

  if (prisma) {
    const ticket = await prisma.ticket.create({
      data: {
        protocol,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "EM_TRIAGEM",
        requesterId: user.id,
        requesterName: user.name,
        aiSummary:
          "Chamado recebido e enviado para triagem automatica com contexto de base de conhecimento.",
        histories: {
          create: [
            {
              actorName: "Intelix Agent",
              action: "Chamado aberto e encaminhado para triagem por IA.",
              note: "O agente vai consultar a base de conhecimento e o historico do cliente.",
            },
          ],
        },
      },
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return serializeTicket(ticket);
  }

  const createdTicket: TicketRecord = {
    id: `ticket_${crypto.randomUUID().slice(0, 8)}`,
    protocol,
    title: data.title,
    description: data.description,
    category: data.category,
    status: "EM_TRIAGEM",
    priority: data.priority,
    requesterId: user.id,
    requesterName: user.name,
    aiSummary:
      "Chamado recebido e encaminhado para triagem automatica com contexto RAG.",
    resolutionNotes: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    histories: [
      {
        id: `history_${crypto.randomUUID().slice(0, 8)}`,
        ticketId: "",
        actorName: "Intelix Agent",
        action: "Chamado aberto e encaminhado para triagem por IA.",
        note: "Sugestoes iniciais preparadas para o analista.",
        createdAt: now.toISOString(),
      },
    ],
  };

  createdTicket.histories = createdTicket.histories.map((history) => ({
    ...history,
    ticketId: createdTicket.id,
  }));

  demoStore.tickets.unshift(createdTicket);
  return createdTicket;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  actorName: string,
  note?: string,
) {
  if (prisma) {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        histories: {
          create: {
            actorName,
            action: `Status atualizado para ${status}.`,
            note,
          },
        },
      },
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return serializeTicket(ticket);
  }

  const ticket = demoStore.tickets.find((item) => item.id === id);

  if (!ticket) {
    throw new Error("Chamado nao encontrado.");
  }

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  ticket.histories.unshift({
    id: `history_${crypto.randomUUID().slice(0, 8)}`,
    ticketId: ticket.id,
    actorName,
    action: `Status atualizado para ${status}.`,
    note,
    createdAt: ticket.updatedAt,
  });

  return ticket;
}

export async function searchRelatedTickets(query: string, limit = 2) {
  const tickets = await listTickets();
  const normalized = query.toLowerCase();

  return tickets
    .filter((ticket) =>
      `${ticket.title} ${ticket.description} ${ticket.aiSummary ?? ""}`
        .toLowerCase()
        .includes(normalized),
    )
    .slice(0, limit);
}
