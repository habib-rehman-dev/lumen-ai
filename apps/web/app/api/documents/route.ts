import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export function GET() {
  return proxyToBackend("/documents");
}

export async function POST(req: Request) {
  return proxyToBackend("/documents", {
    method: "POST",
    body: await req.formData(),
  });
}