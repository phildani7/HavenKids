import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getActiveProfile } from "@/lib/session";

export type Profile = {
  id: string; kind: "adult" | "child"; is_owner: boolean;
  display_name: string; avatar: string; has_pin: boolean;
};

/** Ensure an account+owner profile exists for this email; returns account id. */
export async function ensureAccount(email: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("create_account", { p_email: email });
  if (error) throw new Error(error.message);
  return data?.[0]?.account_id ?? null;
}

export async function accountIdForEmail(email: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("account_id_for_email", { p_email: email });
  if (error) throw new Error(error.message);
  if (data) return data as string;
  // Account not provisioned yet (e.g. signIn callback hiccup) — create it once.
  return ensureAccount(email);
}

export async function listProfiles(accountId: string): Promise<Profile[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_profiles", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function accountHasChildren(accountId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data, error } = await sb.rpc("account_has_children", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function adminPinIsSet(accountId: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data, error } = await sb.rpc("admin_pin_is_set", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function verifyProfilePin(personId: string, pin: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data, error } = await sb.rpc("verify_profile_pin", { p_person_id: personId, p_pin: pin });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function verifyAdminPin(accountId: string, pin: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;
  const { data, error } = await sb.rpc("verify_admin_pin", { p_account_id: accountId, p_pin: pin });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function createProfile(
  accountId: string, kind: "adult" | "child", name: string, avatar: string, pin: string | null) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("create_profile", {
    p_account_id: accountId, p_kind: kind, p_name: name, p_avatar: avatar, p_pin: pin,
  });
  if (error) throw new Error(error.message);
}

export async function setAdminPin(accountId: string, pin: string) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("set_admin_pin", { p_account_id: accountId, p_pin: pin });
  if (error) throw new Error(error.message);
}

/** The active profile, verified to belong to `accountId`. Null if mismatch/missing. */
export async function resolveActiveProfile(accountId: string): Promise<Profile | null> {
  const personId = await getActiveProfile();
  if (!personId) return null;
  const profiles = await listProfiles(accountId);
  return profiles.find((p) => p.id === personId) ?? null;
}

export async function activeStrikes(personId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const { data, error } = await sb.rpc("active_strikes", { p_person_id: personId });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function addStrike(personId: string, reason: string) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.rpc("add_strike", { p_person_id: personId, p_reason: reason });
  if (error) throw new Error(error.message);
}

export async function clearStrikes(personId: string) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.rpc("clear_strikes", { p_person_id: personId });
  if (error) throw new Error(error.message);
}
