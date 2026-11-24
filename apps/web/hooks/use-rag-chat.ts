"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type { ChatDetail } from "@/lib/api";

// Converts messages saved in our database into the shape useChat expects
export function toUIMessages(detail: ChatDetail): UIMessage[] {
  return detail.messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [
      { type: "text", text: m.content },
      // Saved citations are re-attached as the same custom part the stream sends (used in F4)
      ...(m.citations?.length ? [{ type: "data-citations", data: m.citations }] : []),
    ],
  })) as UIMessage[];
}

type Options = {
  sessionId: string | null;          // null = brand-new chat
  initialMessages?: UIMessage[];
  documentIds: string[] | null;      // null = all ready documents
  onSessionCreated?: (id: string) => void;
  onFinish?: () => void;
};

export function useRagChat(opts: Options) {
  // Refs let the transport and callbacks always read the LATEST values
  // without rebuilding useChat (which would reset the conversation)
  const sessionIdRef = useRef(opts.sessionId);
  const documentIdsRef = useRef(opts.documentIds);
  const optsRef = useRef(opts);
  useEffect(() => {
    documentIdsRef.current = opts.documentIds;
    optsRef.current = opts;
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // Customize what is sent to our backend
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            session_id: sessionIdRef.current,
            // Only the newest user message: older history lives in our database
            messages: messages.filter((m) => m.role === "user").slice(-1),
            document_ids: documentIdsRef.current,
          },
        }),
      }),
    [],
  );

  const chat = useChat({
    transport,
    messages: opts.initialMessages,
    onData: (part) => {
      // The backend announces the chat id first. Remember it for follow-ups.
      if (part.type === "data-session") {
        const id = (part.data as { id: string }).id;
        if (sessionIdRef.current !== id) {
          sessionIdRef.current = id;
          optsRef.current.onSessionCreated?.(id);
        }
      }
    },
    onFinish: () => optsRef.current.onFinish?.(),
  });

  // Used when the user clicks "New chat" while this component is still mounted
  const { stop, setMessages } = chat;
  const resetToNewChat = useCallback(() => {
    stop();
    sessionIdRef.current = null;
    setMessages([]);
  }, [stop, setMessages]);

  return { ...chat, sessionIdRef, resetToNewChat };
}