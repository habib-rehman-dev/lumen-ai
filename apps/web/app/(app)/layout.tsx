import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DocumentSelectionProvider } from "@/components/documents/selection-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: no session, no app. Everything inside this group is protected.
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email, image } = session.user;

  return (
    <SidebarProvider>
      <DocumentSelectionProvider>
        <AppSidebar user={{ name, email, image }} />
        <SidebarInset>{children}</SidebarInset>
      </DocumentSelectionProvider>
    </SidebarProvider>
  );
}