"use client";



import { MoreHorizontal, SquarePen, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
    SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton,
    SidebarMenuItem, SidebarMenuSkeleton, SidebarRail, useSidebar,
} from "@workspace/ui/components/sidebar";
import { useChats, useDeleteChat } from "@/hooks/use-chats";
import type { ChatSummary } from "@/lib/api";

import { UserMenu, type SidebarUser } from "@/components/layout/user-menu";

export function AppSidebar({ user }: { user: SidebarUser }) {
    const pathname = usePathname();
    const router = useRouter();
    const { setOpenMobile } = useSidebar();           // closes the drawer on phones
    const { data: chats, isLoading, isError } = useChats();
    const deleteChat = useDeleteChat();
    const [toDelete, setToDelete] = useState<ChatSummary | null>(null);

    function confirmDelete() {
        if (!toDelete) return;
        const target = toDelete;
        deleteChat.mutate(target.id, {
            onSuccess: () => {
                // If the deleted chat is open, go back to a new chat
                if (pathname === `/chat/${target.id}`) router.push("/");
                toast.success("Chat deleted");
                setToDelete(null);
            },
            onError: (err) => toast.error(err.message),
        });
    }

    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-1.5 font-semibold">
                        <Sparkles className="size-5" /> RAG Workspace
                    </div>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton variant="outline" onClick={() => setOpenMobile(false)} render={() => (
                                <Link href="/"><SquarePen /> New chat</Link>
                            )} />

                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Chats</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {/* Loading, error and empty states */}
                                {isLoading &&
                                    // Fixed widths = identical on server and client (no Math.random)
                                    [80, 60, 70, 50, 65].map((width, i) => (
                                        <SidebarMenuItem key={i}>
                                            <div className="flex h-8 items-center px-2">
                                                <Skeleton className="h-4" style={{ width: `${width}%` }} />
                                            </div>
                                        </SidebarMenuItem>
                                    ))}
                                {chats?.length === 0 && (
                                    <p className="px-2 text-sm text-muted-foreground">No chats yet.</p>
                                )}

                                {chats?.map((chat) => {
                                    const href = `/chat/${chat.id}`;
                                    return (
                                        <SidebarMenuItem key={chat.id}>
                                            <SidebarMenuButton isActive={pathname === href} render={() => (
                                                <Link href={href} onClick={() => setOpenMobile(false)}>
                                                    <span className="truncate">{chat.title}</span>
                                                </Link>
                                            )} />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger render={() => (
                                                    <SidebarMenuAction showOnHover aria-label="Chat actions">
                                                        <MoreHorizontal />
                                                    </SidebarMenuAction>
                                                )} />
                                                <DropdownMenuContent side="right" align="start">
                                                    <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(chat)}>
                                                        <Trash2 /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <UserMenu user={user} />
        </SidebarFooter>
                <SidebarRail />  {/* thin strip on desktop to drag-toggle the sidebar */}
            </Sidebar>

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