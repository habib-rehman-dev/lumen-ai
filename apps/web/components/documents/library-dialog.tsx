"use client";

import { DocumentRow } from "@/components/documents/document-row";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useDocuments } from "@/hooks/use-documents";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

// No DialogTrigger here: the sidebar's "Docs" row simply sets open=true
export function LibraryDialog({ open, onOpenChange }: Props) {
  const { data: docs, isLoading, isError } = useDocuments();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Document library</DialogTitle>
          <DialogDescription>
            Everything you upload is saved here. Attach documents to any chat with the + button.
          </DialogDescription>
        </DialogHeader>

        <UploadDropzone />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          )}
          {isError && (
            <p className="text-sm text-muted-foreground">Couldn&apos;t load your documents.</p>
          )}
          {docs?.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No documents yet. Drop a file above to start your library.
            </p>
          )}
          <ul className="space-y-2">
            {docs?.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}