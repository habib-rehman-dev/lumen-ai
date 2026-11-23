import "server-only";
import { SignJWT } from "jose";

async function resolveUserId(): Promise<string | null> {
  // TODO: replace with your real auth, e.g. Auth.js `auth()` or Clerk `auth()`,
  // and return that user's stable id.

  // DEV ONLY: a fixed test user so you can build the UI before auth exists.
  // The NODE_ENV check means this can never run in production.
  if (process.env.NODE_ENV !== "production" && process.env.DEV_USER_ID) {
    return process.env.DEV_USER_ID;
  }
  return null;
}

export async function getBackendToken() {
  const userId = await resolveUserId();
  if (!userId) return null; // not logged in → proxy answers 401

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("rag-frontend")
    .setAudience("rag-backend")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(process.env.BACKEND_JWT_SECRET!));
}