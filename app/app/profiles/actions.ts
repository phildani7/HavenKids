"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, verifyProfilePin, createProfile } from "@/lib/accounts";
import { setActiveProfile, clearAllProfileCookies } from "@/lib/session";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

async function requireAccount(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const accountId = await accountIdForEmail(email);
  if (!accountId) redirect("/login");
  return accountId;
}

export async function pickProfile(formData: FormData) {
  const accountId = await requireAccount();
  const personId = String(formData.get("personId") || "");
  const pin = String(formData.get("pin") || "");

  const profiles = await listProfiles(accountId);
  const profile = profiles.find((p) => p.id === personId);
  if (!profile) redirect("/app/profiles?error=notfound");

  if (profile.has_pin) {
    const lockKey = `pin:${personId}`;
    if (isLocked(lockKey)) redirect("/app/profiles?error=locked");
    const ok = await verifyProfilePin(personId, pin);
    if (!ok) {
      recordFailure(lockKey, 5, 60_000);
      redirect(`/app/profiles?pinFor=${personId}&error=badpin`);
    }
    resetFailures(lockKey);
  }

  await setActiveProfile(personId);
  redirect("/app");
}

export async function addProfile(formData: FormData) {
  const accountId = await requireAccount();
  const kind = String(formData.get("kind") || "child") as "adult" | "child";
  const name = String(formData.get("name") || "").trim().slice(0, 40) || "New profile";
  const avatar = String(formData.get("avatar") || "🙂");
  const pin = String(formData.get("pin") || "").trim() || null;
  await createProfile(accountId, kind, name, avatar, pin);
  redirect("/app/profiles");
}

export async function switchProfile() {
  await clearAllProfileCookies();
  redirect("/app/profiles");
}
