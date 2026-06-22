"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, type Profile } from "@/lib/accounts";
import { moderateText } from "@/lib/moderation/text";
import { assessMessageRisk } from "@/lib/moderation/contact";
import {
  requestConnection, respondConnection, sendMessage,
  reportUser, reportMessage, flagContactRisk,
} from "@/lib/contacts";

// Active context for contact actions. Unlike admin actions, CHILDREN participate
// here (they can request parent-gated connections and DM approved contacts), so we
// resolve the active profile rather than forcing an adult. Self-authorization: the
// sender/requester is always the active profile — never a client-supplied id.
async function activeContext(): Promise<{ accountId: string; profile: Profile } | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const accountId = await accountIdForEmail(email);
  if (!accountId) return null;
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return null;
  return { accountId, profile };
}

/** Send a connection request to another person. Child requesters stay pending until a parent approves. */
export async function requestConnectionAction(
  formData: FormData,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const addressee = (formData.get("addresseeId") as string | null) ?? "";
  if (!addressee) return { ok: false, error: "missing" };
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };
  if (addressee === ctx.profile.id) return { ok: false, error: "self" };
  try {
    const id = await requestConnection(ctx.accountId, ctx.profile.id, addressee);
    return { ok: true, id: id ?? undefined };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}

/** Respond to a connection request addressed to this account. */
export async function respondConnectionAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const connectionId = (formData.get("connectionId") as string | null) ?? "";
  const accept = String(formData.get("accept") || "") === "true";
  if (!connectionId) return { ok: false, error: "missing" };
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };
  try {
    await respondConnection(ctx.accountId, connectionId, accept);
    return { ok: true };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}

/**
 * Send a DM. The DB gate (can_dm) blocks under-13 DMs and any non-active connection
 * with NO row written. Text is moderated → strike + abuse_dm incident on a flag.
 * Off-platform/grooming signals in a minor's message open a grooming_suspected incident
 * (monitored, not silently blocked). Sender is always the active profile.
 */
export async function sendMessageAction(
  formData: FormData,
): Promise<{ ok: boolean; id?: string; blocked?: boolean; reason?: string; flagged?: boolean; word?: string }> {
  const recipient = (formData.get("recipientId") as string | null) ?? "";
  const body = ((formData.get("body") as string | null) ?? "").trim();
  if (!recipient) return { ok: false, reason: "missing" };
  if (!body) return { ok: false, reason: "empty" };
  const ctx = await activeContext();
  if (!ctx) return { ok: false, reason: "auth" };

  const { flagged, word } = moderateText(body);

  let result;
  try {
    result = await sendMessage(ctx.accountId, ctx.profile.id, recipient, body, flagged, word ?? null);
  } catch {
    return { ok: false, reason: "notallowed" };
  }

  // Gate denied (under-13 / not-active / blocked): nothing was written.
  if (result.blocked) return { ok: false, blocked: true, reason: result.reason };

  // Grooming / off-platform escalation for messages involving a minor. We assess on the
  // sender's own messages (involvesMinor when the sender is a child); adult->minor message
  // scoring + connection-level risk land in S1 where the people directory is available.
  // 'review' files an incident but does NOT block (preserve evidence + parent visibility).
  const involvesMinor = ctx.profile.kind === "child";
  const risk = await assessMessageRisk({ body, involvesMinor });
  if (risk === "review" && result.message_id) {
    try {
      await flagContactRisk(ctx.accountId, ctx.profile.id, "grooming_suspected", result.message_id, {
        signal: "off_platform_or_provider_error",
      });
    } catch { /* monitoring/incident best-effort; never block the user flow */ }
  }

  return { ok: true, id: result.message_id ?? undefined, flagged: result.flagged, word: flagged ? word : undefined };
}

/** Report a person → incident (T&S/parent follow-up). */
export async function reportUserAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const target = (formData.get("targetId") as string | null) ?? "";
  const reason = ((formData.get("reason") as string | null) ?? "").slice(0, 500);
  if (!target) return { ok: false, error: "missing" };
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };
  try {
    await reportUser(ctx.accountId, ctx.profile.id, target, { reason });
    return { ok: true };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}

/** Report a message → incident. */
export async function reportMessageAction(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const messageId = (formData.get("messageId") as string | null) ?? "";
  const reason = ((formData.get("reason") as string | null) ?? "").slice(0, 500);
  if (!messageId) return { ok: false, error: "missing" };
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };
  try {
    await reportMessage(ctx.accountId, ctx.profile.id, messageId, { reason });
    return { ok: true };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}
