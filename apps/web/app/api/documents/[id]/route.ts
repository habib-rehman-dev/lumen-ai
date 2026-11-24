import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyToBackend(`/documents/${encodeURIComponent(id)}`);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyToBackend(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}