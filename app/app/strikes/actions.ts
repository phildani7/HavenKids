"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike } from "@/lib/accounts";

async function activePersonId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) return null;
  const profile = await resolveActiveProfile(accountId);
  return profile?.id ?? null;
}

export async function recordStrikeAction(reason: string) {
  const personId = await activePersonId();
  if (!personId) return;
  await addStrike(personId, (reason || "unkind words").slice(0, 200));
}
