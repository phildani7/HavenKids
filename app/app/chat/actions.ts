"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike } from "@/lib/accounts";
import { moderateText } from "@/lib/moderation/text";

// Server-authoritative moderation. Detection AND strike recording happen here,
// not in the browser, so a tampered client cannot fabricate or evade strikes.

export async function moderateMessage(text: string): Promise<{ flagged: boolean; word?: string }> {
  const { flagged, word } = moderateText(text);
  if (!flagged) return { flagged: false };

  // Record the strike against the active profile, derived from the signed
  // session/cookie (never client input).
  const session = await auth();
  if (session?.user?.email) {
    const accountId = await accountIdForEmail(session.user.email);
    if (accountId) {
      const profile = await resolveActiveProfile(accountId);
      if (profile) await addStrike(profile.id, `unkind word: ${word}`);
    }
  }
  return { flagged: true, word };
}
