import "server-only";

import { getBackendToken } from "@/lib/backend-token";

const BACKEND_URL = process.env.BACKEND_URL!;

// Every /api/* route calls this: add the token, forward to FastAPI, pass the answer back
export async function proxyToBackend(path: string, init: RequestInit = {}) {
  // Mint a short-lived token for the current user
  const token = await getBackendToken();
  if (!token) return Response.json({ detail: "Not authenticated" }, { status: 401 });

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    // FastAPI is not running or not reachable
    return Response.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  // Forward only the headers we need. The body stays a stream, so SSE works live.
  const out = new Headers();
  for (const h of ["content-type", "x-vercel-ai-ui-message-stream", "cache-control"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("X-Accel-Buffering", "no"); // stops proxies from buffering the stream
  return new Response(upstream.body, { status: upstream.status, headers: out });
}