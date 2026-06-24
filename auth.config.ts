import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const resendKey = process.env.AUTH_RESEND_KEY;

// Providers are added only when their env vars are set, so a partial config
// (e.g. no Google creds yet) still boots.
const providers: NextAuthConfig["providers"] = [];

if (googleId && googleSecret) {
  providers.push(Google({ clientId: googleId, clientSecret: googleSecret }));
}

if (resendKey) {
  providers.push(
    Resend({ apiKey: resendKey, from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev" })
  );
}

export const hasGoogle = Boolean(googleId && googleSecret);
export const hasResend = Boolean(resendKey);

// Edge-safe config: no adapter, no Node-only imports. Used by middleware AND
// spread into the full Node config in auth.ts.
export const authConfig = {
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?sent=1",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.image = (token.picture as string) ?? session.user.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
