import { DocumentsSheet } from "@/components/documents/documents-sheet";
import { AppHeader } from "@/components/layout/app-header";
import { ChatView } from "@/components/chat/chat-view";

export default function NewChatPage() {
  return <ChatView chatId={null} title="New chat" />;
}
