import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export const GET = () => proxyToBackend("/documents");

export async function POST(req: Request) {
  // fetch() sets the multipart boundary itself, so no Content-Type here
  return proxyToBackend("/documents", { method: "POST", body: await req.formData() });
}