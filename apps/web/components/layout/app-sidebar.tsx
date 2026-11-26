"use client";

import { ChevronDown, Library, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LibraryDialog } from "@/components/documents/library-dialog";
import { ChatListItem } from "@/components/layout/chat-list-item";
import { NavItem } from "@/components/layout/nav-item";
import { SearchDialog } from "@/components/layout/search-dialog";
import { UserMenu, type SidebarUser } from "@/components/layout/user-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarTrigger, useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useChats, useDeleteChat, useUpdateChat } from "@/hooks/use-chats";
import { useDocuments } from "@/hooks/use-documents";
import type { ChatSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

const RECENT_LIMIT = 15; // more than this -> "View all"

type SectionProps = {
  label: string;
  chats: ChatSummary[];
  pathname: string;
  onNavigate: () => void;
  onTogglePin: (chat: ChatSummary) => void;
  onDelete: (chat: ChatSummary) => void;
  footer?: React.ReactNode;
};

// A collapsible group of chats ("Pinned", "Chats")
function ChatSection({ label, chats, pathname, onNavigate, onTogglePin, onDelete, footer }: SectionProps) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <>
          <ul className="mt-0.5 space-y-0.5">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                active={pathname === `/chat/${chat.id}`}
                onNavigate={onNavigate}
                onTogglePin={() => onTogglePin(chat)}
                onDelete={() => onDelete(chat)}
              />
            ))}
          </ul>
          {footer}
        </>
      )}
    </section>
  );
}

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { data: chats, isLoading, isError } = useChats();
  const { data: docs } = useDocuments();
  const deleteChat = useDeleteChat();
  const updateChat = useUpdateChat();

  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ChatSummary | null>(null);

  const closeMobile = () => setOpenMobile(false); // closes the drawer on phones
  const pinned = (chats ?? []).filter((c) => c.pinned);
  const recent = (chats ?? []).filter((c) => !c.pinned);

  function openDialog(open: () => void) {
    closeMobile(); // don't stack a dialog on top of the open drawer
    open();
  }

  function togglePin(chat: ChatSummary) {
    updateChat.mutate(
      { id: chat.id, patch: { pinned: !chat.pinned } },
      { onError: (err) => toast.error(err.message) },
    );
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    deleteChat.mutate(target.id, {
      onSuccess: () => {
        if (pathname === `/chat/${target.id}`) router.push("/"); // leave the deleted chat
        toast.success("Chat deleted");
        setToDelete(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  const sectionProps = { pathname, onNavigate: closeMobile, onTogglePin: togglePin, onDelete: setToDelete };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="gap-3 p-3 pb-2">
          <div className="flex items-center gap-1 px-1">
            <SidebarTrigger className="size-8" />
            <Link href="/" onClick={closeMobile} className="font-serif text-xl tracking-tight">
              RAG Workspace
            </Link>
          </div>
          <nav className="space-y-0.5">
            <NavItem icon={Plus} label="New chat" href="/" active={pathname === "/"} onClick={closeMobile} />
            <NavItem icon={Search} label="Search" onClick={() => openDialog(() => setSearchOpen(true))} />
            <NavItem
              icon={Library}
              label="Docs"
              onClick={() => openDialog(() => setLibraryOpen(true))}
              trailing={docs?.length ? <span className="text-xs text-muted-foreground">{docs.length}</span> : null}
            />
          </nav>
        </SidebarHeader>

        <SidebarContent className="gap-4 px-3 pb-3 pt-2">
          {/* Fixed widths, not random ones (random widths caused the first hydration error) */}
          {isLoading && (
            <div className="space-y-2.5 px-3">
              {[80, 60, 70, 50, 65].map((w) => (
                <Skeleton key={w} className="h-4" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
          {isError && <p className="px-3 text-sm text-muted-foreground">Couldn&apos;t load chats.</p>}
          {chats?.length === 0 && (
            <p className="px-3 text-sm text-muted-foreground">No chats yet. Start one above.</p>
          )}

          {pinned.length > 0 && <ChatSection label="Pinned" chats={pinned} {...sectionProps} />}
          {recent.length > 0 && (
            <ChatSection
              label="Chats"
              chats={recent.slice(0, RECENT_LIMIT)}
              {...sectionProps}
              footer={
                recent.length > RECENT_LIMIT && (
                  <button
                    type="button"
                    onClick={() => openDialog(() => setSearchOpen(true))}
                    className="mt-1 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all
                  </button>
                )
              }
            />
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/70 p-2">
          <UserMenu user={user} />
        </SidebarFooter>
      </Sidebar>

      {/* Dialogs live outside <Sidebar>, so closing the phone drawer doesn't unmount them */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <LibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this chat?"
        description="Its messages will be removed permanently. Your documents are not affected."
        confirmLabel="Delete"
        pending={deleteChat.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}