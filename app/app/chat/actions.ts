"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike } from "@/lib/accounts";

// Server-authoritative moderation. Detection AND strike recording happen here,
// not in the browser, so a tampered client cannot fabricate or evade strikes.
const FLAGS = ["dumb", "stupid", "hate", "shut up"];

export async function moderateMessage(text: string): Promise<{ flagged: boolean; word?: string }> {
  const low = (text || "").toLowerCase();
  const word = FLAGS.find((f) => low.includes(f));
  if (!word) return { flagged: false };

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
