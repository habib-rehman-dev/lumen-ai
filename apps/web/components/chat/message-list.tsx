"use client";

import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { MessageItem, ThinkingIndicator } from "@/components/chat/message-item";
import { getMessageText } from "@/lib/chat-utils";

type Props = { messages: UIMessage[]; status: "submitted" | "streaming" | "ready" | "error" };

export function MessageList({ messages, status }: Props) {
  // A plain scrolling div (not ScrollArea) so we can read and control the scroll position
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const last = messages.at(-1);
  // Waiting = request sent, or streaming has started but no text has arrived yet
  const waiting =
    status === "submitted" ||
    (status === "streaming" && last?.role === "assistant" && !getMessageText(last));
  // Hide assistant messages that have no text yet (the dots stand in for them)
  const visible = messages.filter((m) => m.role === "user" || getMessageText(m));

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    // "Near the bottom" = auto-follow the stream. If the user scrolled up, leave them alone.
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (last?.role === "user") stickToBottom.current = true;  // they just sent: jump down
    if (stickToBottom.current) el.scrollTo({ top: el.scrollHeight });
  }, [messages, status, last?.role]);

  return (
    <div ref={containerRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        {visible.map((m) => <MessageItem key={m.id} message={m} />)}
        {waiting && <ThinkingIndicator />}
      </div>
    </div>
  );
}