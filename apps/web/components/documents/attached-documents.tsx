"use client";

import { FileText, Plus, X } from "lucide-react";

import { useDocumentSelection } from "@/components/documents/selection-provider";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useDocuments } from "@/hooks/use-documents";

// Shows which documents the NEXT question will search, right above the input
export function AttachedDocuments() {
    const { data: docs } = useDocuments();
    const { isSelected, toggle } = useDocumentSelection();
    const [open, setOpen] = useState(false);
    // Only ready documents can be searched
    const ready = (docs ?? []).filter((d) => d.status === "ready");
    if (ready.length === 0) return null;

    const attached = ready.filter((d) => isSelected(d.id));
    const detached = ready.filter((d) => !isSelected(d.id));

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {attached.length === 0 && (
                <span className="text-xs text-muted-foreground">No documents attached</span>
            )}

            {attached.map((doc) => (
                <Badge key={doc.id} variant="secondary" className="max-w-48 gap-1 pr-1">
                    <FileText className="size-3 shrink-0" />
                    <span className="truncate">{doc.filename}</span>
                    {/* X = stop using this document for questions (it is NOT deleted) */}
                    <button
                        type="button"
                        onClick={() => toggle(doc.id)}
                        aria-label={`Don't use ${doc.filename}`}
                        className="rounded-full p-0.5 hover:bg-background/60"
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}

            {/* Re-attach a document you removed */}
            {detached.length > 0 && (
                <DropdownMenu>
  <DropdownMenuTrigger
    render={(props) => (
      <Button
        {...props}
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-xs"
      >
        <Plus className="size-3" /> Add
      </Button>
    )}
  />

  <DropdownMenuContent align="start">
    {detached.map((doc) => (
      <DropdownMenuItem
        key={doc.id}
        onClick={() => toggle(doc.id)}
      >
        <FileText />
        <span className="truncate">{doc.filename}</span>
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
            )}
        </div>
    );
}