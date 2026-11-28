"use client";

import { FileText } from "lucide-react";

import { DocumentRow } from "@/components/documents/document-row";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useDocuments } from "@/hooks/use-documents";
import { useState } from "react";

type Props = {
    selectedIds: string[] | null;
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onSelectNone: () => void;
};

export function DocumentsSheet({
    selectedIds,
    onToggle,
    onSelectAll,
    onSelectNone,
}: Props) {
    const [open, setOpen] = useState(false);
    const { data: docs } = useDocuments();
    const ready = (docs ?? []).filter((doc) => doc.status === "ready");
    const selectedCount =
        selectedIds === null
            ? ready.length
            : ready.filter((doc) => selectedIds.includes(doc.id)).length;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={(props) => (
                    <Button
                        {...props}
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-expanded={open}
                    >
                        <FileText />
                        Documents
                        <Badge variant="secondary">{selectedCount}</Badge>
                    </Button>
                )}
            />

            <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Documents</SheetTitle>
                    <SheetDescription>Choose which files the assistant can search.</SheetDescription>
                </SheetHeader>
                <DocumentsPanel
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                    onSelectAll={onSelectAll}
                    onSelectNone={onSelectNone}
                />
            </SheetContent>
        </Sheet>
    );
}

function DocumentsPanel({
    selectedIds,
    onToggle,
    onSelectAll,
    onSelectNone,
}: Props) {
    const { data: docs, isLoading, isError } = useDocuments();
    const ready = (docs ?? []).filter((doc) => doc.status === "ready");
    const selectedCount =
        selectedIds === null
            ? ready.length
            : ready.filter((doc) => selectedIds.includes(doc.id)).length;

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
            <UploadDropzone />

            {docs && docs.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{selectedCount} selected</span>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={onSelectAll}>Select all</Button>
                        <Button variant="ghost" size="sm" onClick={onSelectNone}>Clear</Button>
                    </div>
                </div>
            )}

            {/* min-h-0 + flex-1 lets the list scroll inside the sheet */}
            <ScrollArea className="min-h-0 flex-1">
                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                )}
                {isError && (
                    <p className="text-sm text-muted-foreground">Couldn&apos;t load your documents.</p>
                )}
                {docs?.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No documents yet. Upload one to get started.
                    </p>
                )}
                <ul className="space-y-2">
                    {docs?.map((doc) => (
                        <DocumentRow
                            key={doc.id}
                            doc={doc}
                            selected={selectedIds === null || selectedIds.includes(doc.id)}
                            onToggleSelection={() => onToggle(doc.id)}
                        />
                    ))}
                </ul>
            </ScrollArea>
        </div>
    );
}