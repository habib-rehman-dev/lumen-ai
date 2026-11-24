import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

// A provider is only enabled when its keys exist in .env.local.
// The login page reads this list to decide which buttons to show.
export const enabledProviders = [
  ...(process.env.AUTH_GITHUB_ID ? [{ id: "github", name: "GitHub" }] : []),
  ...(process.env.AUTH_GOOGLE_ID ? [{ id: "google", name: "Google" }] : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // GitHub/Google read AUTH_GITHUB_ID / AUTH_GOOGLE_ID etc. automatically
    ...(process.env.AUTH_GITHUB_ID ? [GitHub] : []),
    ...(process.env.AUTH_GOOGLE_ID ? [Google] : []),
  ],
  session: { strategy: "jwt" },   // session lives in a signed cookie; no database needed
  pages: { signIn: "/login" },    // our own login page
  callbacks: {
    // Runs at sign-in: build a stable, unique owner id for the backend.
    // The provider prefix prevents a GitHub id from ever colliding with a Google id.
    jwt({ token, account }) {
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`;
      return token;
    },
    // Expose that id on session.user.id (used by getBackendToken)
    session({ session, token }) {
      session.user.id = token.uid as string;
      return session;
    },
  },
});