import NextAuth, { type NextAuthResult } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { backendAuth } from "@/lib/backend-auth";

// OAuth providers are only enabled when their keys exist in .env.local
export const enabledProviders = [
  ...(process.env.AUTH_GITHUB_ID ? [{ id: "github", name: "GitHub" }] : []),
  ...(process.env.AUTH_GOOGLE_ID ? [{ id: "google", name: "Google" }] : []),
];

const nextAuth = NextAuth({
  providers: [
    // Email + password: Auth.js asks FastAPI whether the credentials are right
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        try {
          const res = await backendAuth("/auth/verify", { email, password });
          if (!res.ok) return null;                       // wrong email or password
          const user = await res.json();
          return { id: user.id, name: user.name, email: user.email };
        } catch {
          console.error("[auth] backend unreachable");    // FastAPI is down
          return null;
        }
      },
    }),
    ...(process.env.AUTH_GITHUB_ID ? [GitHub] : []),
    ...(process.env.AUTH_GOOGLE_ID ? [Google] : []),
  ],
  session: { strategy: "jwt" },  // required for Credentials; session lives in a signed cookie
  pages: { signIn: "/login" },
  callbacks: {
    // At sign-in, build the owner id the backend will use. The prefix keeps ids from
    // different login methods from ever colliding.
    jwt({ token, account, user }) {
      if (account) {
        token.uid =
          account.provider === "credentials"
            ? `credentials:${user?.id}`
            : `${account.provider}:${account.providerAccountId}`;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      return session;
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;
export const auth: NextAuthResult["auth"] = nextAuth.auth;