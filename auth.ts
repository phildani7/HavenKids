import NextAuth from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { authConfig } from "./auth.config";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The Supabase adapter is only a Postgres store for Auth.js (verification
// tokens, linked accounts). Supabase Auth itself is NOT used — login is handled
// directly by Google or Resend.
const adapter =
  supabaseUrl && supabaseServiceRole
    ? SupabaseAdapter({ url: supabaseUrl, secret: supabaseServiceRole })
    : undefined;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter,
  callbacks: {
    ...authConfig.callbacks,
    // Node-only: provision a FishHaven account+owner profile on first sign-in.
    // Kept out of auth.config.ts so the edge middleware bundle never imports
    // lib/accounts -> lib/session -> node:crypto.
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
  },
});

export { hasGoogle, hasResend } from "./auth.config";
