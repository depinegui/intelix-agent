import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listChatConversations } from "@/services/chat-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const conversations = await listChatConversations(user.id);
  return NextResponse.json({ conversations });
}
