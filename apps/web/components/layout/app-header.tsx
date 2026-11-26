"use client";

import { SidebarTrigger, useSidebar } from "@workspace/ui/components/sidebar";

export function AppHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;  // right-side actions
}) {
  const { open, isMobile } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4">
      {(isMobile || !open) && <SidebarTrigger className="-ml-1" />}
      <h1 className="truncate font-serif text-base">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}