"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { AlertCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { DocumentsSheet } from "@/components/documents/documents-sheet";

import { AttachMenu } from "@/components/chat/attach-menu";
import { AttachmentBar } from "@/components/chat/attachment-bar";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { AppHeader } from "@/components/layout/app-header";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { useChatScope } from "@/hooks/use-chat-scope";
import { useDocuments } from "@/hooks/use-documents";
import { useRagChat } from "@/hooks/use-rag-chat";
import { friendlyError } from "@/lib/chat-utils";
import { qk } from "@/lib/query-keys";

type Props = {
  chatId: string | null;               // null = new chat
  title: string;
  initialMessages?: UIMessage[];
  initialScope?: string[] | null;      // saved documents of an existing chat
};

export function ChatView({ chatId, title, initialMessages, initialScope = null }: Props) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const { data: docs } = useDocuments();
  const scope = useChatScope(initialScope);

  const docMap = useMemo(() => new Map((docs ?? []).map((d) => [d.id, d])), [docs]);

  // Send only documents that still exist (deleted ones silently drop out)
  const documentIds = useMemo(
    () => (scope.ids === null || !docs ? scope.ids : scope.ids.filter((id) => docMap.has(id))),
    [scope.ids, docs, docMap],
  );

  // Attached files still being processed can't be searched yet, so we hold the send
  const processing = (documentIds ?? [])
    .map((id) => docMap.get(id))
    .filter((d) => d?.status === "pending");
  const readyCount = (docs ?? []).filter((d) => d.status === "ready").length;
  const hasDocs =
    documentIds === null
      ? readyCount > 0
      : documentIds.some((id) => docMap.get(id)?.status === "ready");

  const chat = useRagChat({
    sessionId: chatId,
    initialMessages,
    documentIds,
    onSessionCreated: (id) => {
      // Show the real URL WITHOUT remounting, so the running stream isn't interrupted
      window.history.replaceState(null, "", `/chat/${id}`);
      qc.invalidateQueries({ queryKey: qk.chats });
    },
    onFinish: () => qc.invalidateQueries({ queryKey: qk.chats }),
  });

  // "New chat" clicked while a finished new chat is still on screen: start completely fresh
  useEffect(() => {
    if (!chatId && pathname === "/" && chat.sessionIdRef.current) {
      chat.resetToNewChat();
      scope.selectAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const busy = chat.status === "submitted" || chat.status === "streaming";

  return (
    <div className="flex h-svh flex-col">
      <AppHeader title={title}>
  <DocumentsSheet />
</AppHeader>

      {chat.messages.length === 0 ? (
        <EmptyState hasDocs={hasDocs} onPick={(text) => chat.sendMessage({ text })} />
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

        <AttachmentBar ids={scope.ids} onRemove={scope.remove} onUseAll={scope.selectAll} />
        {processing.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Waiting for {processing[0]?.filename} to finish processing…
          </p>
        )}

        <ChatInput
          busy={busy}
          sendDisabled={processing.length > 0}
          attach={<AttachMenu attachedIds={scope.ids} onAttach={scope.add} />}
          onSend={(text) => chat.sendMessage({ text })}
          onStop={() => chat.stop()}
        />
        <p className="text-center text-xs text-muted-foreground">
          Answers come from your attached documents. Double-check anything important.
        </p>
      </div>
    </div>
  );
}