import { ChatView } from "@/components/chat/chat-view";
import { requireSessionUser } from "@/lib/session";
import { getLatestConversation } from "@/services/chat-service";

export default async function ChatPage() {
  const user = await requireSessionUser();
  const conversationState = await getLatestConversation(user.id);

  return (
    <ChatView
      initialConversation={conversationState?.conversation ?? null}
      initialMessages={conversationState?.messages ?? []}
    />
  );
}
