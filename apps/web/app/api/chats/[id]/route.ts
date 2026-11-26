import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyToBackend(`/chats/${encodeURIComponent(id)}`);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyToBackend(`/chats/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  return proxyToBackend(`/chats/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
  });
}