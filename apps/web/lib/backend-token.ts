import "server-only";

import { SignJWT } from "jose";

import { auth } from "@/auth";

// Reads the logged-in user from the Auth.js session and mints a 15-minute
// token that FastAPI verifies. Returns null when nobody is logged in.
export async function getBackendToken() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)            // becomes the owner id on every document and chat
    .setIssuer("rag-frontend")
    .setAudience("rag-backend")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.BACKEND_JWT_SECRET!));
}