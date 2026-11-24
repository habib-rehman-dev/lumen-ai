import { ExistingChat } from "@/components/chat/existing-chat";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;   // params is a Promise in Next 15/16
  return <ExistingChat chatId={id} />;
}