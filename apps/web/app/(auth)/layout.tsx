import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? These pages aren't needed
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-5" /> RAG Workspace
      </div>
      {children}
    </main>
  );
}