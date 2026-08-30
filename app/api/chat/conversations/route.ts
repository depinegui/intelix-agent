import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { listChatConversations } from "@/services/chat-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "USE_CHAT")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const conversations = await listChatConversations(user.id);
  return NextResponse.json({ conversations });
}
