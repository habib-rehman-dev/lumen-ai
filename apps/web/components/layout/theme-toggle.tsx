"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@workspace/ui/components/button";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

export function ThemeToggle() {
    const { setTheme } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon" aria-label="Change theme" />
                }
            >
                <Sun className="size-4 dark:hidden" />
                <Moon className="hidden size-4 dark:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setTheme("light")}><Sun /> Light</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("dark")}><Moon /> Dark</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setTheme("system")}><Monitor /> System</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}