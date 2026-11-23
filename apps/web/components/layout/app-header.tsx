import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";

export function AppHeader({
  title,
  children,   // right-side actions, e.g. the documents button in F2
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />  {/* opens/closes the sidebar (mobile + desktop) */}
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="truncate text-sm font-medium">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}