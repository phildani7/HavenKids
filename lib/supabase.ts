import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anonymous client — safe to use on the server for non-privileged reads.
// NOTE: the F1 identity RPCs have EXECUTE revoked from the anon role and
// granted only to service_role, so privileged calls (accounts/profiles/PINs,
// log_activity/my_activity) must use getSupabaseAdmin() below, NOT this client.
// The service-role key is therefore required for the identity/activity features.
let anonClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient | null {
  if (anonClient) return anonClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "fishhaven" } },
  });
  return anonClient;
}

// Admin client (service-role). Required for the F1 identity/activity RPCs,
// which are callable only by service_role. Server-only — the service-role key
// must never be exposed to the browser.
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "fishhaven-admin" } },
  });
  return adminClient;
}
