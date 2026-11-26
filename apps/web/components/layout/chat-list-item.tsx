"use client";

import { MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { ChatSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  chat: ChatSummary;
  active: boolean;
  onNavigate: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
};

export function ChatListItem({ chat, active, onNavigate, onTogglePin, onDelete }: Props) {
  return (
    <li className="group/chat relative">
      <Link
        href={`/chat/${chat.id}`}
        onClick={onNavigate}
        className={cn(
          "block truncate rounded-lg py-2 pl-3 pr-9 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
          active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        )}
      >
        {chat.title}
      </Link>

      <DropdownMenu>
        {/* Styled directly (no asChild/render), so it renders the same on server and client */}
        <DropdownMenuTrigger
          aria-label="Chat actions"
          className={cn(
            "absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground",
            "hover:bg-background/70 hover:text-foreground focus-visible:opacity-100",
            // Always visible on phones (no hover there); on desktop it appears on hover
            "md:opacity-0 md:group-hover/chat:opacity-100",
            "data-[state=open]:opacity-100 data-popup-open:opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-44">
          <DropdownMenuItem onClick={onTogglePin}>
            {chat.pinned ? <PinOff /> : <Pin />}
            {chat.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}