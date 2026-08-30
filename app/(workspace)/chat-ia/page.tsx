import { ChatView } from "@/components/chat/chat-view";
import { requireSessionUser } from "@/lib/session";
import {
  getLatestConversation,
  listChatConversations,
} from "@/services/chat-service";

export default async function ChatPage() {
  const user = await requireSessionUser();
  const [conversationState, initialConversations] = await Promise.all([
    getLatestConversation(user.id),
    listChatConversations(user.id),
  ]);

  return (
    <ChatView
      initialConversation={conversationState?.conversation ?? null}
      initialMessages={conversationState?.messages ?? []}
      initialConversations={initialConversations}
    />
  );
}
