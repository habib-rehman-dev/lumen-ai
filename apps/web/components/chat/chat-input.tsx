"use client";

import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";

type Props = {
  busy: boolean;
  sendDisabled?: boolean;        // e.g. an attached file is still processing
  attach?: React.ReactNode;      // the "+" button, shown inside the box
  onSend: (text: string) => void;
  onStop: () => void;
};

export function ChatInput({ busy, sendDisabled, attach, onSend, onStop }: Props) {
  const [value, setValue] = useState("");
  const canSend = value.trim().length > 0 && !busy && !sendDisabled;

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Enter sends, Shift+Enter adds a new line (not while composing with an IME)
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask about your documents…"
        rows={1}
        maxLength={8000}
        className="max-h-48 min-h-12 resize-none pl-12 pr-14"  /* room for both buttons */
      />
      <div className="absolute bottom-2 left-2">{attach}</div>
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