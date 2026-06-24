import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, type Profile } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";

/** Resolve the logged-in account id, or bounce to login. */
export async function requireAccountId(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const id = await accountIdForEmail(email);
  if (!id) redirect("/login");
  return id;
}

/**
 * Require that the ACTIVE profile is an adult. Children must never perform
 * account/admin/moderation operations, so they are bounced to the picker.
 * Returns the account id and the active (adult) profile.
 */
export async function requireActiveAdult(): Promise<{ accountId: string; profile: Profile }> {
  const accountId = await requireAccountId();
  const profile = await resolveActiveProfile(accountId);
  if (!profile) redirect("/app/profiles");
  if (profile.kind !== "adult") redirect("/app/profiles?choose=1");
  return { accountId, profile };
}

/** Require the admin/guardian zone to be unlocked for this account. */
export async function requireAdminUnlock(accountId: string): Promise<void> {
  if ((await getAdminUnlock()) !== accountId) redirect("/app/admin");
}
