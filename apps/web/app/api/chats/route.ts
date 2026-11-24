import { proxyToBackend } from "@/lib/backend";

export const dynamic = "force-dynamic";

export function GET() {
  return proxyToBackend("/chats");
}