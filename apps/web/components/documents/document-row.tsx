"use client";

import { FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/documents/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useDeleteDocument } from "@/hooks/use-documents";
import type { DocumentItem } from "@/lib/api";
import { formatBytes } from "@/lib/format";

export function DocumentRow({ doc }: { doc: DocumentItem }) {
  const del = useDeleteDocument();
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="flex items-start gap-3 rounded-lg border p-3">
      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={doc.filename}>{doc.filename}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatBytes(doc.size_bytes)}</span>
          <StatusBadge status={doc.status} />
        </div>
        {/* The backend's explanation, e.g. "Unsupported file type" */}
        {doc.status === "failed" && doc.error && (
          <p className="mt-1 text-xs text-destructive">{doc.error}</p>
        )}
      </div>

      <Tooltip>
        <TooltipTrigger render={()=>(
<Button variant="ghost" size="icon" className="size-8 shrink-0"
                  onClick={() => setConfirming(true)} aria-label={`Delete ${doc.filename}`}>
            <Trash2 className="size-4" />
          </Button>
        )}
          
        />
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this document?"
        description="It is removed from your library and from every chat that uses it. Past answers stay."
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