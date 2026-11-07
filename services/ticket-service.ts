import { z } from "zod";
import { Prisma } from "@prisma/client";
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
    "SUPORTE_GERAL",
  ]),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
  protocol: z.string().optional(),
});

export function serializeTicket(record: {
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

export async function listTickets(input?: number | {
  limit?: number;
  requesterId?: string;
}) {
  const options = typeof input === "number" ? { limit: input } : input ?? {};

  if (prisma) {
    const tickets = await prisma.ticket.findMany({
      where: options.requesterId ? { requesterId: options.requesterId } : undefined,
      include: {
        histories: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      ...(options.limit ? { take: options.limit } : {}),
    });

    return tickets.map(serializeTicket);
  }

  return [...demoStore.tickets]
    .filter((ticket) => !options.requesterId || ticket.requesterId === options.requesterId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, options.limit);
}

export function getProtocolPreview() {
  const today = new Date();

  return `INT-${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-####`;
}

async function getNextDatabaseProtocol() {
  if (!prisma) return getNextProtocol();

  const today = new Date();
  const prefix = `INT-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-`;
  const tickets = await prisma.ticket.findMany({
    where: { protocol: { startsWith: prefix } },
    select: { protocol: true },
  });
  const nextSequence = tickets.reduce((highest, ticket) => {
    const sequence = Number(ticket.protocol.slice(prefix.length));
    return Number.isInteger(sequence) ? Math.max(highest, sequence) : highest;
  }, 0) + 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

export async function createTicket(
  input: TicketInput,
  user: SessionUser,
  options?: { chatEscalationMessageId?: string },
) {
  const data = ticketSchema.parse(input);
  const requestedProtocol = data.protocol?.trim() || undefined;
  const now = new Date();

  /*
   * Quando o chamado vem do fallback do Intelix,
   * o chat adiciona esta identificação na descrição.
   */
  const isIntelixEscalation = data.description.includes(
    "Chamado encaminhado pelo Intelix Agent.",
  );

  /*
   * Chamados normais continuam indo para triagem.
   * Chamados que a IA não conseguiu resolver vão
   * diretamente para atendimento humano.
   */
  const initialStatus: TicketStatus = isIntelixEscalation
    ? "ESCALADO"
    : "EM_TRIAGEM";

  const aiSummary = isIntelixEscalation
    ? "Chamado escalado pelo Intelix Agent por falta de contexto confiavel na base de conhecimento."
    : "Chamado recebido e enviado para triagem automatica com contexto de base de conhecimento.";

  const initialHistoryAction = isIntelixEscalation
    ? "Chamado escalado pelo Intelix Agent para atendimento humano."
    : "Chamado aberto e encaminhado para triagem por IA.";

  const initialHistoryNote = isIntelixEscalation
    ? "O agente nao encontrou contexto confiavel suficiente para responder com seguranca."
    : "O agente vai consultar a base de conhecimento e o historico do cliente.";

  if (prisma) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const protocol = requestedProtocol ?? await getNextDatabaseProtocol();
      try {
        const ticket = await prisma.ticket.create({
          data: {
            protocol,
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority,
            status: initialStatus,
            requesterId: user.id,
            requesterName: user.name,
            chatEscalationMessageId: options?.chatEscalationMessageId,
            aiSummary,
            histories: {
              create: [
                {
                  actorName: "Intelix Agent",
                  action: initialHistoryAction,
                  note: initialHistoryNote,
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
      } catch (error) {
        const isProtocolCollision =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.includes("protocol");
        if (requestedProtocol || !isProtocolCollision || attempt === 2) {
          throw error;
        }
      }
    }
  }

  const protocol = requestedProtocol || getNextProtocol();
  const createdTicket: TicketRecord = {
    id: `ticket_${crypto.randomUUID().slice(0, 8)}`,
    protocol,
    title: data.title,
    description: data.description,
    category: data.category,
    status: initialStatus,
    priority: data.priority,
    requesterId: user.id,
    requesterName: user.name,
    aiSummary,
    resolutionNotes: "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    histories: [
      {
        id: `history_${crypto.randomUUID().slice(0, 8)}`,
        ticketId: "",
        actorName: "Intelix Agent",
        action: initialHistoryAction,
        note: initialHistoryNote,
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
    return prisma.$transaction(async (transaction) => {
      const previousTicket = await transaction.ticket.findUnique({
        where: { id },
        select: { status: true },
      });

      if (!previousTicket) {
        throw new Error("Chamado nao encontrado.");
      }

      const ticket = await transaction.ticket.update({
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

      return {
        ticket: serializeTicket(ticket),
        previousStatus: previousTicket.status,
      };
    });
  }

  const ticket = demoStore.tickets.find((item) => item.id === id);

  if (!ticket) {
    throw new Error("Chamado nao encontrado.");
  }

  const previousStatus = ticket.status;

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

  return {
    ticket,
    previousStatus,
  };
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
