"use server";

import { redirect } from "next/navigation";
import { verifyAdminPin, setAdminPin, adminPinIsSet, createProfile, resolveActiveProfile, clearStrikes } from "@/lib/accounts";
import { setAdminUnlock } from "@/lib/session";
import { requireActiveAdult, requireAdminUnlock } from "@/lib/guards";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

const PIN_RE = /^\d{4,}$/; // at least 4 digits, numeric

export async function unlockAdmin(formData: FormData) {
  const { accountId } = await requireActiveAdult();
  const pin = String(formData.get("pin") || "");
  if (!pin) redirect("/app/admin"); // empty submit: just show the form, no failed attempt
  const lockKey = `admin:${accountId}`;
  if (isLocked(lockKey)) redirect("/app/admin?error=locked");
  if (!(await verifyAdminPin(accountId, pin))) {
    recordFailure(lockKey, 5, 60_000);
    redirect("/app/admin?error=badpin");
  }
  resetFailures(lockKey);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function setupAdminPin(formData: FormData) {
  const { accountId } = await requireActiveAdult();
  // Setup is first-time only. Resetting an existing PIN must NOT be possible
  // without the current PIN (otherwise a child could overwrite it) — block it.
  if (await adminPinIsSet(accountId)) redirect("/app/admin?error=already");
  const pin = String(formData.get("pin") || "").trim();
  if (!PIN_RE.test(pin)) redirect("/app/admin?error=shortpin");
  await setAdminPin(accountId, pin);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function addChildProfile(formData: FormData) {
  const { accountId } = await requireActiveAdult();
  await requireAdminUnlock(accountId);
  const name = String(formData.get("name") || "").trim().slice(0, 40) || "Kiddo";
  const avatar = String(formData.get("avatar") || "🦄");
  const rawPin = String(formData.get("pin") || "").trim();
  const pin = rawPin === "" ? null : rawPin;
  if (pin !== null && !PIN_RE.test(pin)) redirect("/app/admin?error=shortpin");
  await createProfile(accountId, "child", name, avatar, pin);
  redirect("/app/admin");
}

export async function clearChildStrikes(formData: FormData) {
  const { accountId } = await requireActiveAdult();
  await requireAdminUnlock(accountId);
  const personId = String(formData.get("personId") || "");
  // Verify the target belongs to this account before clearing.
  const profiles = await import("@/lib/accounts").then((m) => m.listProfiles(accountId));
  if (!profiles.some((p) => p.id === personId)) redirect("/app/admin");
  await clearStrikes(personId);
  redirect("/app/admin");
}
