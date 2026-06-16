"use server";

import { redirect } from "next/navigation";
import { listProfiles, verifyProfilePin } from "@/lib/accounts";
import { setActiveProfile, clearAllProfileCookies, clearAdminUnlock } from "@/lib/session";
import { requireAccountId } from "@/lib/guards";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

export async function pickProfile(formData: FormData) {
  const accountId = await requireAccountId();
  const personId = String(formData.get("personId") || "");
  const pin = String(formData.get("pin") || "");

  const profiles = await listProfiles(accountId);
  const profile = profiles.find((p) => p.id === personId);
  if (!profile) redirect("/app/profiles?error=notfound");

  if (profile.has_pin) {
    const lockKey = `pin:${personId}`;
    if (isLocked(lockKey)) redirect("/app/profiles?error=locked");
    if (!pin) redirect(`/app/profiles?pinFor=${personId}`);
    const ok = await verifyProfilePin(personId, pin);
    if (!ok) {
      recordFailure(lockKey, 5, 60_000);
      redirect(`/app/profiles?pinFor=${personId}&error=badpin`);
    }
    resetFailures(lockKey);
  }

  await clearAdminUnlock();
  await setActiveProfile(personId);
  redirect("/app");
}

export async function switchProfile() {
  await clearAllProfileCookies();
  redirect("/app/profiles");
}
