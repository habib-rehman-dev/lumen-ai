import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  href?: string;               // with href it renders a link, without it a button
  onClick?: () => void;
  active?: boolean;
  trailing?: React.ReactNode;  // e.g. a count on the right
};

export function NavItem({ icon: Icon, label, href, onClick, active, trailing }: Props) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground",
    "transition-colors hover:bg-sidebar-accent",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
  );
  const content = (
    <>
      <Icon className="size-4.5 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </>
  );

  return href ? (
    <Link href={href} onClick={onClick} className={className}>{content}</Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>{content}</button>
  );
}