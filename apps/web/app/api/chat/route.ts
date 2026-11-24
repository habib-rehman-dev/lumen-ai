import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  return proxyToBackend("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await req.text(),
    signal: req.signal,
  });
}