import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { hasPermission } from "@/lib/permissions";
import { sendChatMessage } from "@/services/chat-service";

export const runtime = "nodejs";

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(4_000),
});

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "USE_CHAT")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = chatSchema.parse(body);
    const reply = await sendChatMessage(data.conversationId, data.message, user);
    return NextResponse.json(reply);
  } catch (error) {
    return NextResponse.json(
      {
        message: safeRouteError(error, "Nao foi possivel consultar o agente."),
      },
      { status: 400 },
    );
  }
}
