import { needsPromptClarification } from "@/agents/intelix-support-agent";
import { getSupportAgent } from "@/agents/registry";
import { Prisma } from "@prisma/client";
import { demoStore } from "@/database/demo-store";
import { redactSensitiveData } from "@/lib/redact-sensitive-data";
import { prisma } from "@/lib/prisma";
import { searchKnowledgeDocuments } from "@/services/knowledge-service";
import { createTicket, serializeTicket } from "@/services/ticket-service";
import {
  hasIndexedKnowledgeBase,
  searchKnowledgeBase,
} from "@/services/knowledge-rag-service";
import type {
  ChatConversationRecord,
  MessageFeedback,
  ChatMessageRecord,
  ChatReply,
  SessionUser,
} from "@/types";

function serializeMessage(record: {
  id: string;
  conversationId: string;
  role: ChatMessageRecord["role"];
  content: string;
  confidence: number | null;
  citations: unknown;
  responseTimeMs: number | null;
  retrievedSourcesCount: number | null;
  withoutContext: boolean | null;
  feedback: MessageFeedback | null;
  feedbackReason?: string | null;
  feedbackComment?: string | null;
  feedbackAt?: Date | string | null;
  escalatedTicketId?: string | null;
  createdAt: Date | string;
}): ChatMessageRecord {
  return {
    id: record.id,
    conversationId: record.conversationId,
    role: record.role,
    content: record.content,
    confidence: record.confidence ?? undefined,
    citations: Array.isArray(record.citations)
      ? (record.citations as ChatMessageRecord["citations"])
      : undefined,
    responseTimeMs: record.responseTimeMs ?? undefined,
    retrievedSourcesCount: record.retrievedSourcesCount ?? undefined,
    withoutContext: record.withoutContext ?? undefined,
    feedback: record.feedback ?? undefined,
    feedbackReason: record.feedbackReason ?? undefined,
    feedbackComment: record.feedbackComment ?? undefined,
    feedbackAt: record.feedbackAt
      ? record.feedbackAt instanceof Date
        ? record.feedbackAt.toISOString()
        : record.feedbackAt
      : undefined,
    escalatedTicketId: record.escalatedTicketId ?? undefined,
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
  };
}

function serializeConversation(record: {
  id: string;
  title: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}): ChatConversationRecord {
  return {
    id: record.id,
    title: record.title,
    userId: record.userId,
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
    updatedAt:
      record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : record.updatedAt,
  };
}

function getConversationState(record: {
  id: string;
  title: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages: Array<Parameters<typeof serializeMessage>[0]>;
}) {
  return {
    conversation: serializeConversation(record),
    messages: record.messages.map(serializeMessage),
  };
}

export async function listChatConversations(userId: string) {
  if (prisma) {
    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map(serializeConversation);
  }

  return demoStore.conversations
    .filter((conversation) => conversation.userId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getConversationForUser(userId: string, conversationId: string) {
  if (prisma) {
    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return conversation ? getConversationState(conversation) : null;
  }

  const conversation = demoStore.conversations.find(
    (item) => item.id === conversationId && item.userId === userId,
  );

  if (!conversation) {
    return null;
  }

  return {
    conversation,
    messages: demoStore.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  };
}

export async function getLatestConversation(userId: string) {
  if (prisma) {
    const conversation = await prisma.chatConversation.findFirst({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      return null;
    }

    return getConversationState(conversation);
  }

  const conversation = demoStore.conversations
    .filter((item) => item.userId === userId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

  if (!conversation) {
    return null;
  }

  return {
    conversation,
    messages: demoStore.messages
      .filter((message) => message.conversationId === conversation.id)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  };
}

function createConversationTitle(prompt: string) {
  return prompt.length > 36 ? `${prompt.slice(0, 36)}...` : prompt;
}

export async function updateChatMessageFeedback(
  userId: string,
  messageId: string,
  feedback: MessageFeedback | undefined,
  reason?: string,
  comment?: string,
) {
  if (prisma) {
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        role: "ASSISTANT",
        conversation: { userId },
      },
    });

    if (!message) {
      return null;
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id: message.id },
      data: {
        feedback: feedback ?? null,
        feedbackReason: feedback === "NOT_HELPFUL" ? reason ?? null : null,
        feedbackComment: feedback === "NOT_HELPFUL" ? comment ?? null : null,
        feedbackAt: feedback ? new Date() : null,
      },
    });

    return {
      message: serializeMessage(updatedMessage),
      previousFeedback: message.feedback,
      previousFeedbackReason: message.feedbackReason,
    };
  }

  const message = demoStore.messages.find(
    (item) =>
      item.id === messageId &&
      item.role === "ASSISTANT" &&
      demoStore.conversations.some(
        (conversation) =>
          conversation.id === item.conversationId && conversation.userId === userId,
      ),
  );

  if (!message) {
    return null;
  }

  const previousFeedback = message.feedback;
  message.feedback = feedback;
  message.feedbackReason = feedback === "NOT_HELPFUL" ? reason : undefined;
  message.feedbackComment = feedback === "NOT_HELPFUL" ? comment : undefined;
  message.feedbackAt = feedback ? new Date().toISOString() : undefined;
  return { message, previousFeedback, previousFeedbackReason: undefined };
}

export async function sendChatMessage(
  conversationId: string | undefined,
  prompt: string,
  user: SessionUser,
): Promise<ChatReply> {
  const trimmedPrompt = prompt.trim();

  if (!trimmedPrompt) {
    throw new Error("A mensagem nao pode estar vazia.");
  }

  const sanitizedPrompt = redactSensitiveData(trimmedPrompt);
  const responseStartedAt = performance.now();
  const needsClarification = needsPromptClarification(sanitizedPrompt);
  const indexedDocuments = needsClarification
    ? []
    : await searchKnowledgeBase(sanitizedPrompt, 4);
  const shouldUseLegacyKnowledge =
    !needsClarification && indexedDocuments.length === 0 && !(await hasIndexedKnowledgeBase());
  const relatedDocuments =
    !shouldUseLegacyKnowledge
      ? indexedDocuments
      : await searchKnowledgeDocuments(sanitizedPrompt, 3).then((documents) =>
          documents.map((document) => ({
            id: document.id,
            title: document.title,
            excerpt: document.excerpt,
            content: document.content,
            category: document.category,
            source: `base-manual/${document.slug}`,
            score: 0.6,
          })),
        );
  const agent = getSupportAgent();

  if (prisma) {
    const activeConversation = conversationId
      ? await prisma.chatConversation.findFirst({
          where: { id: conversationId, userId: user.id },
        })
      : await prisma.chatConversation.create({
          data: {
            title: createConversationTitle(sanitizedPrompt),
            userId: user.id,
          },
        });

    if (!activeConversation) {
      throw new Error("Conversa nao encontrada.");
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "USER",
        content: sanitizedPrompt,
      },
    });

    await prisma.chatConversation.update({
      where: { id: activeConversation.id },
      data: { updatedAt: new Date() },
    });

    const historyRecords = await prisma.chatMessage.findMany({
      where: { conversationId: activeConversation.id },
      orderBy: { createdAt: "asc" },
    });

    const reply = await agent.respond({
      prompt: sanitizedPrompt,
      history: historyRecords.map(serializeMessage),
      relatedDocuments,
    });
    const responseTimeMs = Math.max(
      1,
      Math.round(performance.now() - responseStartedAt),
    );
    const retrievedSourcesCount = reply.citations.length;
    // Pedidos de esclarecimento nao sao falhas de cobertura da base.
    const withoutContext = reply.needsClarification ? undefined : retrievedSourcesCount === 0;

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "ASSISTANT",
        content: reply.content,
        confidence: reply.confidence,
        citations: reply.citations as unknown as Prisma.InputJsonValue,
        responseTimeMs,
        retrievedSourcesCount,
        withoutContext,
      },
    });
    const updatedConversation = await prisma.chatConversation.update({
      where: { id: activeConversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: activeConversation.id,
      conversation: serializeConversation(updatedConversation),
      userMessage: serializeMessage(userMessage),
      message: serializeMessage(assistantMessage),
    };
  }

  let activeConversation = conversationId
    ? demoStore.conversations.find(
        (item) => item.id === conversationId && item.userId === user.id,
      ) ?? null
    : null;

  if (conversationId && !activeConversation) {
    throw new Error("Conversa nao encontrada.");
  }

  if (!activeConversation) {
    activeConversation = {
      id: `conv_${crypto.randomUUID().slice(0, 8)}`,
      title: createConversationTitle(sanitizedPrompt),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoStore.conversations.unshift(activeConversation);
  }

  const userMessage: ChatMessageRecord = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    conversationId: activeConversation.id,
    role: "USER",
    content: sanitizedPrompt,
    createdAt: new Date().toISOString(),
  };
  demoStore.messages.push(userMessage);

  const history = demoStore.messages
    .filter((message) => message.conversationId === activeConversation!.id)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const reply = await agent.respond({
    prompt: sanitizedPrompt,
    history,
    relatedDocuments,
  });
  const responseTimeMs = Math.max(
    1,
    Math.round(performance.now() - responseStartedAt),
  );
  const retrievedSourcesCount = reply.citations.length;
  // Mantem a mesma semantica do PostgreSQL quando a aplicacao usa o fallback.
  const withoutContext = reply.needsClarification ? undefined : retrievedSourcesCount === 0;

  const assistantMessage: ChatMessageRecord = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    conversationId: activeConversation.id,
    role: "ASSISTANT",
    content: reply.content,
    confidence: reply.confidence,
    citations: reply.citations,
    responseTimeMs,
    retrievedSourcesCount,
    withoutContext,
    createdAt: new Date().toISOString(),
  };

  activeConversation.updatedAt = assistantMessage.createdAt;
  demoStore.messages.push(assistantMessage);

  return {
    conversationId: activeConversation.id,
    conversation: activeConversation,
    userMessage,
    message: assistantMessage,
  };
}

export async function escalateChatMessageToTicket(
  user: SessionUser,
  messageId: string,
) {
  if (!prisma) {
    throw new Error("O encaminhamento persistente requer um banco de dados configurado.");
  }

  const message = await prisma.chatMessage.findFirst({
    where: { id: messageId, role: "ASSISTANT", conversation: { userId: user.id } },
    include: {
      conversation: {
        include: { messages: { orderBy: { createdAt: "desc" } } },
      },
    },
  });
  if (!message) throw new Error("Mensagem nao encontrada.");

  if (message.escalatedTicketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: message.escalatedTicketId },
      include: { histories: { orderBy: { createdAt: "desc" } } },
    });
    if (ticket) return { ticket: serializeTicket(ticket), created: false };
  }

  const existingEscalation = await prisma.ticket.findUnique({
    where: { chatEscalationMessageId: message.id },
    include: { histories: { orderBy: { createdAt: "desc" } } },
  });
  if (existingEscalation) {
    await prisma.chatMessage.update({
      where: { id: message.id },
      data: { escalatedTicketId: existingEscalation.id },
    });
    return { ticket: serializeTicket(existingEscalation), created: false };
  }

  const question = message.conversation.messages.find((item) =>
    item.role === "USER" && item.createdAt <= message.createdAt,
  );
  if (!question) throw new Error("Nao foi possivel identificar a pergunta original.");

  let ticket;
  try {
    ticket = await createTicket({
      title: `Atendimento Intelix: ${question.content.slice(0, 80)}`,
      description: [
        "Chamado encaminhado pelo Intelix Agent.",
        "",
        "Pergunta original:",
        question.content,
        "",
        "Motivo do encaminhamento:",
        "O agente nao encontrou contexto confiavel suficiente na base de conhecimento para responder com seguranca.",
      ].join("\n"),
      category: "SUPORTE_GERAL",
      priority: "MEDIA",
    }, user, { chatEscalationMessageId: message.id });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
    const concurrentTicket = await prisma.ticket.findUnique({
      where: { chatEscalationMessageId: message.id },
      include: { histories: { orderBy: { createdAt: "desc" } } },
    });
    if (!concurrentTicket) throw error;
    await prisma.chatMessage.update({
      where: { id: message.id },
      data: { escalatedTicketId: concurrentTicket.id },
    });
    return { ticket: serializeTicket(concurrentTicket), created: false };
  }

  await prisma.chatMessage.update({
    where: { id: message.id },
    data: { escalatedTicketId: ticket.id },
  });
  return { ticket, created: true };
}
