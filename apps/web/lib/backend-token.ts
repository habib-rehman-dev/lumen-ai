import "server-only"; // build error if this is ever imported in client code
import { SignJWT } from "jose";
import { auth } from "@/auth"; // only reads the session, doesn't change auth logic

export async function getBackendToken() {
  const session = await auth();
  // Use the user id if your session exposes it; otherwise fall back to email
  const userId = session?.user?.id ?? session?.user?.email;
  if (!userId) return null; // not logged in

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)            // becomes `sub` on the backend
    .setIssuer("rag-frontend")
    .setAudience("rag-backend")
    .setIssuedAt()
    .setExpirationTime("15m")      // short-lived on purpose
    .sign(new TextEncoder().encode(process.env.BACKEND_JWT_SECRET!));
}