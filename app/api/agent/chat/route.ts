import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { sendChatMessage } from "@/services/chat-service";

export const runtime = "nodejs";

const agentChatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, "A mensagem nao pode estar vazia."),
});

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = agentChatSchema.parse(body);
    const reply = await sendChatMessage(data.conversationId, data.message, user);

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
