import { getSupportAgent } from "@/agents/registry";
import { Prisma } from "@prisma/client";
import { demoStore } from "@/database/demo-store";
import { redactSensitiveData } from "@/lib/redact-sensitive-data";
import { prisma } from "@/lib/prisma";
import { searchKnowledgeDocuments } from "@/services/knowledge-service";
import {
  hasIndexedKnowledgeBase,
  searchKnowledgeBase,
} from "@/services/knowledge-rag-service";
import type {
  ChatConversationRecord,
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

    return {
      conversation: serializeConversation(conversation),
      messages: conversation.messages.map(serializeMessage),
    };
  }

  const conversation = demoStore.conversations.find((item) => item.userId === userId);

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
  const indexedDocuments = await searchKnowledgeBase(sanitizedPrompt, 4);
  const shouldUseLegacyKnowledge =
    indexedDocuments.length === 0 && !(await hasIndexedKnowledgeBase());
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
    const activeConversation =
      (conversationId &&
        (await prisma.chatConversation.findUnique({
          where: { id: conversationId },
        }))) ||
      (await prisma.chatConversation.create({
        data: {
          title: createConversationTitle(sanitizedPrompt),
          userId: user.id,
        },
      }));

    const userMessage = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "USER",
        content: sanitizedPrompt,
      },
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

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: activeConversation.id,
        role: "ASSISTANT",
        content: reply.content,
        confidence: reply.confidence,
        citations: reply.citations as unknown as Prisma.InputJsonValue,
      },
    });

    return {
      conversationId: activeConversation.id,
      userMessage: serializeMessage(userMessage),
      message: serializeMessage(assistantMessage),
    };
  }

  let activeConversation =
    (conversationId &&
      demoStore.conversations.find((item) => item.id === conversationId)) ||
    null;

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

  const assistantMessage: ChatMessageRecord = {
    id: `msg_${crypto.randomUUID().slice(0, 8)}`,
    conversationId: activeConversation.id,
    role: "ASSISTANT",
    content: reply.content,
    confidence: reply.confidence,
    citations: reply.citations,
    createdAt: new Date().toISOString(),
  };

  activeConversation.updatedAt = assistantMessage.createdAt;
  demoStore.messages.push(assistantMessage);

  return {
    conversationId: activeConversation.id,
    userMessage,
    message: assistantMessage,
  };
}
