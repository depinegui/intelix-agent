import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getConversationForUser } from "@/services/chat-service";

interface ConversationRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: ConversationRouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const conversationState = await getConversationForUser(user.id, id);

  if (!conversationState) {
    return NextResponse.json({ message: "Conversa nao encontrada." }, { status: 404 });
  }

  return NextResponse.json(conversationState);
}
