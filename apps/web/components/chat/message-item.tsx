import type { UIMessage } from "ai";
import { Sparkles } from "lucide-react";

import { Markdown } from "@/components/chat/markdown";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { getMessageCitations, getMessageText } from "@/lib/chat-utils";

import { Sources } from "@/components/chat/sources";
// import {  getMessageText } from "@/lib/chat-utils";

function AssistantAvatar() {
    return (
        <Avatar className="size-8 shrink-0">
            <AvatarFallback><Sparkles className="size-4" /></AvatarFallback>
        </Avatar>
    );
}

export function MessageItem({ message }: { message: UIMessage }) {
    const text = getMessageText(message);

    if (message.role === "user") {
        return (
            <div className="flex justify-end">
                {/* whitespace-pre-wrap keeps the user's line breaks */}
                <div className="max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {text}
                </div>
            </div>
        );
    }

      const citations = getMessageCitations(message);

  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="min-w-0 flex-1 pt-1">
        <Markdown citations={citations}>{text}</Markdown>
        {citations.length > 0 && <Sources citations={citations} />}
      </div>
    </div>
  );
}

// Three bouncing dots, shown while we wait for the first words of an answer
export function ThinkingIndicator() {
    return (
        <div className="flex gap-3" role="status" aria-label="Assistant is thinking">
            <AssistantAvatar />
            <div className="flex items-center gap-1 pt-3">
                {[0, 150, 300].map((delay) => (
                    <span
                        key={delay}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${delay}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}