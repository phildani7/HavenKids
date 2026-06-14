"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, verifyAdminPin, setAdminPin, createProfile } from "@/lib/accounts";
import { setAdminUnlock } from "@/lib/session";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

async function requireAccount(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const id = await accountIdForEmail(email);
  if (!id) redirect("/login");
  return id;
}

export async function unlockAdmin(formData: FormData) {
  const accountId = await requireAccount();
  const pin = String(formData.get("pin") || "");
  const lockKey = `admin:${accountId}`;
  if (isLocked(lockKey)) redirect("/app/admin?error=locked");
  const ok = await verifyAdminPin(accountId, pin);
  if (!ok) {
    recordFailure(lockKey, 5, 60_000);
    redirect("/app/admin?error=badpin");
  }
  resetFailures(lockKey);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function setupAdminPin(formData: FormData) {
  const accountId = await requireAccount();
  const pin = String(formData.get("pin") || "").trim();
  if (pin.length < 4) redirect("/app/admin?error=shortpin");
  await setAdminPin(accountId, pin);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function addChildProfile(formData: FormData) {
  const accountId = await requireAccount();
  const name = String(formData.get("name") || "").trim().slice(0, 40) || "Kiddo";
  const avatar = String(formData.get("avatar") || "🦄");
  const pin = String(formData.get("pin") || "").trim() || null;
  await createProfile(accountId, "child", name, avatar, pin);
  redirect("/app/admin");
}
