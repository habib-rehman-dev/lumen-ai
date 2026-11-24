"use client";

import { FileText } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { useDocuments } from "@/hooks/use-documents";
import type { Citation } from "@/lib/api";

export function SourceDetails({ citation }: { citation: Citation }) {
  const { data: docs } = useDocuments();
  // Chats keep their citations after a document is deleted, so flag those
  const deleted = !!docs && !docs.some((d) => d.id === citation.document_id);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={citation.filename}>
            {citation.filename}
          </p>
          <p className="text-xs text-muted-foreground">
            {citation.page ? `Page ${citation.page}` : "Page not available"}
          </p>
        </div>
        {deleted && <Badge variant="outline" className="ml-auto shrink-0">Deleted</Badge>}
      </div>
      {/* The exact passage the answer was based on */}
      <p className="line-clamp-6 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs text-muted-foreground">
        {citation.snippet}
      </p>
    </div>
  );
}