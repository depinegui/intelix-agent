import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { updateChatMessageFeedback } from "@/services/chat-service";

const feedbackSchema = z.object({
  feedback: z.enum(["HELPFUL", "NOT_HELPFUL"]).nullable(),
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
    const message = await updateChatMessageFeedback(
      user.id,
      id,
      data.feedback ?? undefined,
    );

    if (!message) {
      return NextResponse.json(
        { message: "Mensagem nao encontrada." },
        { status: 404 },
      );
    }

    return NextResponse.json({ message });
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
