import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { SupabaseAdapter } from "@auth/supabase-adapter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;
const resendKey = process.env.AUTH_RESEND_KEY;

// Providers are added only when their env vars are set, so a partial
// config (e.g. no Google creds yet) still boots.
const providers: NextAuthConfig["providers"] = [];

if (googleId && googleSecret) {
  providers.push(
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    })
  );
}

if (resendKey) {
  providers.push(
    Resend({
      apiKey: resendKey,
      from: process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev",
    })
  );
}

// The Supabase adapter is only used as a Postgres store for Auth.js
// (verification tokens, linked accounts). Supabase Auth itself is NOT
// used — login is handled directly by Google or Resend.
const adapter =
  supabaseUrl && supabaseServiceRole
    ? SupabaseAdapter({ url: supabaseUrl, secret: supabaseServiceRole })
    : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?sent=1",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (user?.email) {
        try {
          const { ensureAccount } = await import("@/lib/accounts");
          await ensureAccount(user.email);
        } catch {
          // never block login on provisioning hiccups; entry routing will retry
        }
      }
      return true;
    },
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
});

export const hasGoogle = Boolean(googleId && googleSecret);
export const hasResend = Boolean(resendKey);
