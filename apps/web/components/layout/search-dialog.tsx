"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { useChats } from "@/hooks/use-chats";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function SearchDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { data: chats } = useChats();
  const [query, setQuery] = useState("");

  // Title search, done in the browser (the chat list is already loaded)
  const q = query.trim().toLowerCase();
  const results = (chats ?? []).filter((c) => c.title.toLowerCase().includes(q)).slice(0, 50);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) setQuery(""); // clear the box when the dialog closes
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search chats</DialogTitle>
          <DialogDescription className="sr-only">Find a chat by its title</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your chats…"
            className="pl-9"
          />
        </div>

        <ul className="max-h-72 overflow-y-auto">
          {results.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => { router.push(`/chat/${chat.id}`); handleOpenChange(false); }}
                className="w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
              >
                {chat.title}
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">No chats found.</li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}