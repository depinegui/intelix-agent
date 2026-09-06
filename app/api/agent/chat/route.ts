import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { sendChatMessage } from "@/services/chat-service";

export const runtime = "nodejs";

const agentChatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "A mensagem nao pode estar vazia."),
});

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  if (!hasPermission(user, "USE_CHAT")) {
    return NextResponse.json(
      { message: "Acesso negado." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const data = agentChatSchema.parse(body);

    const reply = await sendChatMessage(
      data.conversationId,
      data.message,
      user,
    );

    await createAuditLogSafely({
      user,
      action: "CREATE",
      entityType: "CHAT_MESSAGE",
      entityId: reply.message.id,
      description: "Resposta gerada pelo Intelix Agent.",
      metadata: {
        event: "AI_RESPONSE",
        conversationId: reply.conversationId,
        userMessageId: reply.userMessage?.id ?? null,
        assistantMessageId: reply.message.id,
        confidence: reply.message.confidence ?? null,
        responseTimeMs: reply.message.responseTimeMs ?? null,
        retrievedSourcesCount:
          reply.message.retrievedSourcesCount ?? 0,
        withoutContext: reply.message.withoutContext ?? false,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel consultar o agente.",
      },
      { status: 400 },
    );
  }
}