import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ACTIVE_PROFILE_COOKIE = "fh_active_profile";
const ADMIN_UNLOCK_COOKIE = "fh_admin_unlock";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function hmac(input: string): string {
  return createHmac("sha256", secret()).update(input).digest("base64url");
}

/** Sign a plain value as `<b64url(value)>.<sig>`. */
export function signValue(value: string): string {
  const v = Buffer.from(value, "utf8").toString("base64url");
  return `${v}.${hmac(v)}`;
}

export function verifySigned(signed: string | undefined | null): string | null {
  if (!signed || !signed.includes(".")) return null;
  const [v, sig] = signed.split(".");
  if (!v || !sig) return null;
  const expected = hmac(v);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(v, "base64url").toString("utf8");
}

/** Sign a value with an embedded timestamp for TTL checks. */
export function signWithTs(value: string, ts: number = Date.now()): string {
  return signValue(`${ts}:${value}`);
}

export function verifyWithTs(signed: string | undefined | null, ttlMs: number): string | null {
  const raw = verifySigned(signed);
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx < 0) return null;
  const ts = Number(raw.slice(0, idx));
  const value = raw.slice(idx + 1);
  if (!Number.isFinite(ts) || Date.now() - ts > ttlMs) return null;
  return value;
}

// ---- cookie accessors (server-only) ----

export async function setActiveProfile(personId: string) {
  (await cookies()).set(ACTIVE_PROFILE_COOKIE, signValue(personId), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
  });
}

export async function getActiveProfile(): Promise<string | null> {
  return verifySigned((await cookies()).get(ACTIVE_PROFILE_COOKIE)?.value);
}

export async function clearActiveProfile() {
  (await cookies()).delete(ACTIVE_PROFILE_COOKIE);
}

const ADMIN_TTL_MS = 30 * 60 * 1000;

export async function setAdminUnlock(accountId: string) {
  (await cookies()).set(ADMIN_UNLOCK_COOKIE, signWithTs(accountId), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: ADMIN_TTL_MS / 1000,
  });
}

export async function getAdminUnlock(): Promise<string | null> {
  return verifyWithTs((await cookies()).get(ADMIN_UNLOCK_COOKIE)?.value, ADMIN_TTL_MS);
}

export async function clearAdminUnlock() {
  (await cookies()).delete(ADMIN_UNLOCK_COOKIE);
}

export async function clearAllProfileCookies() {
  const c = await cookies();
  c.delete(ACTIVE_PROFILE_COOKIE);
  c.delete(ADMIN_UNLOCK_COOKIE);
}
