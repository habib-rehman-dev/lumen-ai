"use client";

import { Loader2, Plus, UploadCloud, FileText } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { ACCEPT_EXTENSIONS, validateUpload } from "@/lib/upload-rules";

type Props = {
    attachedIds: string[] | null;
    onAttach: (id: string) => void;
};

export function AttachMenu({ attachedIds, onAttach }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const upload = useUploadDocument();
    const { data: docs } = useDocuments();

    // Library files that are ready and not already attached to this chat
    const choices = (docs ?? []).filter(
        (d) => d.status === "ready" && !(attachedIds ?? []).includes(d.id),
    );

    async function handleFiles(files: FileList) {
        for (const file of Array.from(files)) {
            const problem = validateUpload(file);
            if (problem) {
                toast.error(`${file.name}: ${problem}`);
                continue;
            }
            try {
                // Upload saves it to the library; we also attach it to this chat
                const { document, duplicate } = await upload.mutateAsync(file);
                onAttach(document.id);
                toast.success(
                    duplicate
                        ? `${file.name} was already in your library. Attached to this chat.`
                        : `${file.name} saved to your library and attached to this chat.`,
                );
            } catch (err) {
                toast.error(`${file.name}: ${(err as Error).message}`);
            }
        }
        if (inputRef.current) inputRef.current.value = ""; // allow picking the same file again
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={(props) => (
                        <Button
                            {...props}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-full"
                            aria-label="Attach a document"
                            disabled={upload.isPending}
                        >
                            {upload.isPending
                                ? <Loader2 className="size-4 animate-spin" />
                                : <Plus className="size-4" />}
                        </Button>
                    )}
                />
                <DropdownMenuContent align="start" side="top" className="w-64">
                    <DropdownMenuItem onClick={() => inputRef.current?.click()}>
                        <UploadCloud /> Upload from device
                    </DropdownMenuItem>
                    {choices.length > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>From your library</DropdownMenuLabel>
                            <div className="max-h-56 overflow-y-auto">
                                {choices.map((doc) => (
                                    <DropdownMenuItem
                                        key={doc.id}
                                        onClick={() => onAttach(doc.id)}
                                    >
                                        <FileText /> <span className="truncate">{doc.filename}</span>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file picker, opened by "Upload from device" */}
            <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept={ACCEPT_EXTENSIONS.join(",")}
                onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            />
        </>
    );
}