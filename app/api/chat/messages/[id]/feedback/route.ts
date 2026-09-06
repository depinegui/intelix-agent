import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { updateChatMessageFeedback } from "@/services/chat-service";

const feedbackSchema = z.object({
  feedback: z.enum(["HELPFUL", "NOT_HELPFUL"]).nullable(),
  reason: z.enum([
    "INCORRECT",
    "INCOMPLETE",
    "NOT_ANSWERED",
    "INADEQUATE_SOURCE",
    "CONFUSING",
    "OTHER",
  ]).optional(),
  comment: z.string().trim().max(500).optional(),
}).superRefine((data, context) => {
  if (data.feedback === "NOT_HELPFUL" && !data.reason) {
    context.addIssue({ code: "custom", message: "Selecione um motivo para o feedback." });
  }
});

interface FeedbackRouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: Request,
  context: FeedbackRouteContext,
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "USE_CHAT")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const data = feedbackSchema.parse(await request.json());
    const { id } = await context.params;
    const result = await updateChatMessageFeedback(
      user.id,
      id,
      data.feedback ?? undefined,
      data.reason,
      data.comment,
    );

    if (!result) {
      return NextResponse.json(
        { message: "Mensagem nao encontrada." },
        { status: 404 },
      );
    }

    if (
      result.previousFeedback !== result.message.feedback ||
      result.previousFeedbackReason !== result.message.feedbackReason
    ) {
      await createAuditLogSafely({
        user,
        action: "FEEDBACK",
        entityType: "CHAT_MESSAGE",
        entityId: result.message.id,
        description: "Feedback da resposta do chat atualizado.",
        metadata: {
          previousFeedback: result.previousFeedback ?? null,
          newFeedback: result.message.feedback ?? null,
          feedbackReason: result.message.feedbackReason ?? null,
          conversationId: result.message.conversationId,
          confidence: result.message.confidence ?? null,
        },
      });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o feedback.",
      },
      { status: 400 },
    );
  }
}
