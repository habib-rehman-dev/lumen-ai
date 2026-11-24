"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@workspace/ui/components/sidebar";

export type SidebarUser = { name?: string | null; email?: string | null; image?: string | null };

export function UserMenu({ user }: { user: SidebarUser }) {
    const qc = useQueryClient();
    const { isMobile } = useSidebar();
    const label = user.name ?? user.email ?? "Account";

    function handleSignOut() {
        qc.clear();   // forget this user's cached chats and documents
        void signOut({ redirectTo: "/login" });
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger render={() => (<SidebarMenuButton size="lg">
                        <Avatar className="size-8">
                            <AvatarImage src={user.image ?? undefined} alt="" />
                            <AvatarFallback>{label.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{label}</span>
                            {user.email && (
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>)}

                    />
                    <DropdownMenuContent side={isMobile ? "bottom" : "right"} align="end" className="w-56">
                        <DropdownMenuItem onSelect={handleSignOut}>
                            <LogOut /> Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}