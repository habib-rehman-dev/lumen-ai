import { DocumentsSheet } from "@/components/documents/documents-sheet";
import { AppHeader } from "@/components/layout/app-header";

export default function NewChatPage() {
  return (
    <div className="flex h-svh flex-col">
      <AppHeader title="New chat">
        <DocumentsSheet />
      </AppHeader>
      <main className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
        The chat view comes in F3.
      </main>
    </div>
  );
}