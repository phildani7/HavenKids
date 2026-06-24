import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

// SAFE-3 — service-role wrappers over the contact/DM safety RPCs. Called ONLY by
// the trusted server (service-role key); every RPC is locked to service_role.
// These are the rails S1 (connections/DMs UI + realtime) builds on.

export type ConnectionStatus = "pending" | "active" | "declined" | "blocked";

export type ChildConnection = {
  id: string;
  other_person: string;
  status: ConnectionStatus;
  created_at: string;
};

export type DmMessage = {
  id: string;
  connection_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  flagged: boolean;
  created_at: string;
};

export type DmResult = {
  message_id: string | null;
  flagged: boolean;
  blocked: boolean;
  reason: string;
};

/** Create a pending connection request (adult sides auto-approved; child sides need a parent). */
export async function requestConnection(
  accountId: string, requester: string, addressee: string,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("request_connection", {
    p_account_id: accountId, p_requester: requester, p_addressee: addressee,
  });
  if (error) throw new Error(error.message);
  return (data as string) ?? null;
}

/** Parent records approval for THEIR OWN child on a connection (ownership enforced in the RPC). */
export async function approveChildConnection(
  accountId: string, connectionId: string, childId: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.rpc("set_connection_parent_ok", {
    p_account_id: accountId, p_connection_id: connectionId, p_child_id: childId,
  });
  if (error) throw new Error(error.message);
}

/** Addressee accepts or declines a connection request. */
export async function respondConnection(
  accountId: string, connectionId: string, accept: boolean,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.rpc("respond_connection", {
    p_account_id: accountId, p_connection_id: connectionId, p_accept: accept,
  });
  if (error) throw new Error(error.message);
}

/** Block a connection (overrides everything; can_dm returns false both ways). */
export async function blockConnection(accountId: string, connectionId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.rpc("block_connection", {
    p_account_id: accountId, p_connection_id: connectionId,
  });
  if (error) throw new Error(error.message);
}

/** The DM permission gate: may these two people DM right now, and if not, why. */
export async function canDm(a: string, b: string): Promise<{ allowed: boolean; reason: string }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { allowed: false, reason: "unconfigured" };
  const { data, error } = await sb.rpc("can_dm", { p_a: a, p_b: b });
  if (error) throw new Error(error.message);
  const row = (data as Array<{ allowed: boolean; reason: string }>)?.[0];
  return row ?? { allowed: false, reason: "unknown" };
}

/** The guarded send path: enforces can_dm, persists (monitored), strikes + incident on a flag. */
export async function sendMessage(
  accountId: string, sender: string, recipient: string, body: string,
  flagged: boolean, term: string | null,
): Promise<DmResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { message_id: null, flagged: false, blocked: true, reason: "unconfigured" };
  const { data, error } = await sb.rpc("send_message", {
    p_account_id: accountId, p_sender: sender, p_recipient: recipient,
    p_body: body, p_flagged: flagged, p_term: term,
  });
  if (error) throw new Error(error.message);
  const row = (data as DmResult[])?.[0];
  return row ?? { message_id: null, flagged: false, blocked: true, reason: "unknown" };
}

/** Parent monitoring: a child's connections (ownership enforced in the RPC). */
export async function listChildConnections(accountId: string, child: string): Promise<ChildConnection[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_child_connections", {
    p_account_id: accountId, p_child: child,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChildConnection[];
}

/** Parent monitoring: full bodies of a child's DMs (ownership enforced in the RPC). */
export async function listChildMessages(accountId: string, child: string): Promise<DmMessage[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_child_messages", {
    p_account_id: accountId, p_child: child,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as DmMessage[];
}

/** User-initiated report of a person → incident. */
export async function reportUser(
  accountId: string, reporter: string, target: string, detail: Record<string, unknown>,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("report_user", {
    p_account_id: accountId, p_reporter: reporter, p_target: target, p_detail: detail,
  });
  if (error) throw new Error(error.message);
  return (data as string) ?? null;
}

/** User-initiated report of a message → incident. */
export async function reportMessage(
  accountId: string, reporter: string, messageId: string, detail: Record<string, unknown>,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("report_message", {
    p_account_id: accountId, p_reporter: reporter, p_message_id: messageId, p_detail: detail,
  });
  if (error) throw new Error(error.message);
  return (data as string) ?? null;
}

/** Automated contact-risk escalation (grooming detection) → immutable incident. */
export async function flagContactRisk(
  accountId: string, personId: string, kind: string, ref: string | null, detail: Record<string, unknown>,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.rpc("flag_contact_risk", {
    p_account_id: accountId, p_person_id: personId, p_kind: kind, p_ref: ref, p_detail: detail,
  });
  if (error) throw new Error(error.message);
  return (data as string) ?? null;
}
