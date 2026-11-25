"use client";

import { FileText, Library, Loader2, TriangleAlert, X } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { useDocuments } from "@/hooks/use-documents";

type Props = {
  ids: string[] | null;            // null = whole library
  onRemove: (id: string) => void;
  onUseAll: () => void;
};

export function AttachmentBar({ ids, onRemove, onUseAll }: Props) {
  const { data: docs } = useDocuments();
  const ready = (docs ?? []).filter((d) => d.status === "ready");

  // Default mode: this chat searches the whole library
  if (ids === null) {
    if (ready.length === 0) return null;
    return (
      <Badge variant="secondary" className="w-fit gap-1">
        <Library className="size-3" /> All documents ({ready.length})
      </Badge>
    );
  }

  const byId = new Map((docs ?? []).map((d) => [d.id, d]));
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ids.length === 0 && (
        <span className="text-xs text-muted-foreground">No documents attached</span>
      )}
      {ids.map((id) => {
        const doc = byId.get(id);
        if (!doc) return null; // deleted from the library: hide it
        return (
          <Badge
            key={id}
            variant={doc.status === "failed" ? "destructive" : "secondary"}
            className="max-w-52 gap-1 pr-1"
            title={doc.error ?? doc.filename}
          >
            {/* Spinner while processing, warning if it failed, file icon when ready */}
            {doc.status === "pending" ? (
              <Loader2 className="size-3 shrink-0 animate-spin" />
            ) : doc.status === "failed" ? (
              <TriangleAlert className="size-3 shrink-0" />
            ) : (
              <FileText className="size-3 shrink-0" />
            )}
            <span className="truncate">{doc.filename}</span>
            {/* Removes it from THIS chat only. The file stays in the library. */}
            <button
              type="button"
              onClick={() => onRemove(id)}
              aria-label={`Remove ${doc.filename} from this chat`}
              className="rounded-full p-0.5 hover:bg-background/60"
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onUseAll}>
        Use all documents
      </Button>
    </div>
  );
}