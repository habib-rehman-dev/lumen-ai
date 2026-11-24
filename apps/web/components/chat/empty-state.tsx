import { Sparkles } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

const SUGGESTIONS = [
  "Summarize the main points",
  "What are the key takeaways?",
  "List the important names, dates, and numbers",
];

export function EmptyState({ hasDocs, onPick }: { hasDocs: boolean; onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="rounded-full bg-muted p-3"><Sparkles className="size-6" /></div>
      <div>
        <h2 className="text-xl font-semibold">Ask your documents anything</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasDocs
            ? "Answers come only from your selected documents, with sources."
            : "Open Documents (top right) and upload a file to get started."}
        </p>
      </div>
      {hasDocs && (
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <Button key={s} variant="outline" size="sm" onClick={() => onPick(s)}>{s}</Button>
          ))}
        </div>
      )}
    </div>
  );
}