"use client";

import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";

type Props = { busy: boolean; onSend: (text: string) => void; onStop: () => void };

export function ChatInput({ busy, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !busy;

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="relative">
      {/* shadcn's Textarea auto-grows with its content; max-h caps it */}
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a new line. The isComposing check avoids sending
          // while someone is still composing text with an IME keyboard.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your documents…"
        rows={1}
        maxLength={8000}  // same limit as the backend
        className="max-h-48 min-h-12 resize-none pr-14"
      />
      {busy ? (
        <Button size="icon" className="absolute bottom-2 right-2 size-8 rounded-full"
                onClick={onStop} aria-label="Stop generating">
          <Square className="size-3.5 fill-current" />
        </Button>
      ) : (
        <Button size="icon" className="absolute bottom-2 right-2 size-8 rounded-full"
                onClick={submit} disabled={!canSend} aria-label="Send message">
          <ArrowUp className="size-4" />
        </Button>
      )}
    </div>
  );
}