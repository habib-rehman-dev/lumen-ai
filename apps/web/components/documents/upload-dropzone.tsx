"use client";

import { Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useUploadDocument } from "@/hooks/use-documents";
import { cn } from "@workspace/ui/lib/utils";

// Keep these in sync with the backend (SUPPORTED_EXTENSIONS and max_upload_mb)
const ACCEPT = [".pdf", ".docx", ".txt", ".md", ".csv"];
const MAX_MB = 25;

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadDocument();

  async function handleFiles(files: FileList | File[]) {
    // One at a time: simple, and kind to the backend
    for (const file of Array.from(files)) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      // Quick client-side checks for instant feedback (the server re-checks everything)
      if (!ACCEPT.includes(ext)) {
        toast.error(`${file.name}: unsupported type (use ${ACCEPT.join(", ")})`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`${file.name}: larger than ${MAX_MB} MB`);
        continue;
      }
      try {
        const { duplicate } = await upload.mutateAsync(file);
        if (duplicate) toast.info(`${file.name} was already uploaded`);
        else toast.success(`${file.name} uploaded`);
      } catch (err) {
        toast.error(`${file.name}: ${(err as Error).message}`);
      }
    }
    if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging && "border-primary bg-muted",
        )}
      >
        {upload.isPending ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="size-6 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">Drop files here or click to browse</span>
        <span className="text-xs text-muted-foreground">
          PDF, DOCX, TXT, MD, CSV · up to {MAX_MB} MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPT.join(",")}
        onChange={(e) => e.target.files && void handleFiles(e.target.files)}
      />
    </>
  );
}