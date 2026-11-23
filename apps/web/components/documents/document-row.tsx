"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useDocumentSelection } from "@/components/documents/selection-provider";
import { StatusBadge } from "@/components/documents/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useDeleteDocument } from "@/hooks/use-documents";
import type { DocumentItem } from "@/lib/api";
import { formatBytes } from "@/lib/format";

export function DocumentRow({ doc }: { doc: DocumentItem }) {
  const { isSelected, toggle } = useDocumentSelection();
  const del = useDeleteDocument();
  const [confirming, setConfirming] = useState(false);
  const ready = doc.status === "ready";

  return (
    <li className="flex items-start gap-3 rounded-lg border p-3">
      {/* Only ready documents can be searched, so only they can be selected */}
      <Checkbox
        className="mt-1"
        checked={ready && isSelected(doc.id)}
        disabled={!ready}
        onCheckedChange={() => toggle(doc.id)}
        aria-label={`Include ${doc.filename} in answers`}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={doc.filename}>{doc.filename}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(doc.size_bytes)}</span>
          <StatusBadge status={doc.status} />
        </div>
        {/* The backend's explanation, e.g. "Unsupported file type" or "No extractable text" */}
        {doc.status === "failed" && doc.error && (
          <p className="mt-1 text-xs text-destructive">{doc.error}</p>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger render={() => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${doc.filename}`}
          >
            <Trash2 className="size-4" />
          </Button>
        )} />
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this document?"
        description="The file and its search data are removed permanently. Past chats keep their answers."
        confirmLabel="Delete"
        pending={del.isPending}
        onConfirm={() =>
          del.mutate(doc.id, {
            onSuccess: () => { toast.success("Document deleted"); setConfirming(false); },
            onError: (err) => toast.error(err.message),
          })
        }
      />
    </li>
  );
}