"use client";

import type { UIMessage } from "ai";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { friendlyError } from "@/lib/chat-utils";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { DocumentsSheet } from "@/components/documents/documents-sheet";
import { useDocumentSelection } from "@/components/documents/selection-provider";
import { AppHeader } from "@/components/layout/app-header";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { useRagChat } from "@/hooks/use-rag-chat";
import { qk } from "@/lib/query-keys";
import { AttachedDocuments } from "@/components/documents/attached-documents";
type Props = {
  chatId: string | null;            // null = new chat
  title: string;
  initialMessages?: UIMessage[];
};

export function ChatView({ chatId, title, initialMessages }: Props) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const { documentIds, selectedCount } = useDocumentSelection();

  const chat = useRagChat({
    sessionId: chatId,
    initialMessages,
    documentIds,
    onSessionCreated: (id) => {
      // Show the real URL WITHOUT remounting, so the running stream isn't interrupted
      window.history.replaceState(null, "", `/chat/${id}`);
      qc.invalidateQueries({ queryKey: qk.chats });  // new chat appears in the sidebar
    },
    // Refreshes the sidebar order AND cached chat details (their keys start with "chats")
    onFinish: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });

  // "New chat" clicked while a replaceState'd chat is still on screen: start fresh
  useEffect(() => {
    if (!chatId && pathname === "/" && chat.sessionIdRef.current) chat.resetToNewChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const busy = chat.status === "submitted" || chat.status === "streaming";

  return (
    <div className="flex h-svh flex-col">
      <AppHeader title={title}>
        <DocumentsSheet />
      </AppHeader>

      {chat.messages.length === 0 ? (
        <EmptyState hasDocs={selectedCount > 0} onPick={(text) => chat.sendMessage({ text })} />
      ) : (
        <MessageList messages={chat.messages} status={chat.status} />
      )}

      <div className="mx-auto w-full max-w-3xl space-y-2 px-4 pb-4">
        {chat.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-2">
              <span>{friendlyError(chat.error?.message)}</span>
              <Button variant="outline" size="sm" onClick={() => chat.clearError()}>Dismiss</Button>
            </AlertDescription>
          </Alert>
        )}
        <AttachedDocuments />
        <ChatInput
          busy={busy}
          onSend={(text) => chat.sendMessage({ text })}
          onStop={() => chat.stop()}
        />
        <p className="text-center text-xs text-muted-foreground">
          Answers come from your selected documents. Double-check anything important.
        </p>
      </div>
    </div>
  );
}