import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Anonymous client — safe to use on the server. All privileged
// writes go through SECURITY DEFINER RPCs (public.log_activity,
// public.my_activity). That means Haven Kids works with just the
// anon/publishable key — no service-role key required.
let anonClient: SupabaseClient | null = null;

export function getSupabaseAnon(): SupabaseClient | null {
  if (anonClient) return anonClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  anonClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "haven-kids" } },
  });
  return anonClient;
}

// Admin client (service-role). Optional — only needed if you want
// to bypass RLS for reads or background jobs. The default runtime
// path uses the anon client + RPCs and does not require this.
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "haven-kids-admin" } },
  });
  return adminClient;
}
