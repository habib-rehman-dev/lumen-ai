import { AppSidebar } from "@/components/layout/app-sidebar";
import { DocumentSelectionProvider } from "@/components/documents/selection-provider";
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar";


export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            {/* Selection state lives here so the sheet AND the chat (F3) share it */}
            <DocumentSelectionProvider>
                <AppSidebar /><SidebarInset>
                        {children}
                </SidebarInset>
            </DocumentSelectionProvider>
        </SidebarProvider>

    );
}