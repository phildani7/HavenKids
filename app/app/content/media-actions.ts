"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile } from "@/lib/accounts";
import { signUpload } from "@/lib/media";
import { createMedia } from "@/lib/content";

// Active-context helper (mirrors actions.ts pattern).
async function activeContext() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const accountId = await accountIdForEmail(email);
  if (!accountId) return null;
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return null;
  return { accountId, profile };
}

/**
 * Step 1 of the client upload flow.
 * Returns a signed upload URL the client uses to PUT the file directly to Storage.
 * The file lands in the private 'media' bucket and is NOT publicly accessible.
 *
 * Client flow:
 *   1. requestUpload(formData)           → { signedUrl, token, path }
 *   2. PUT file to signedUrl             (client-side fetch, no server round-trip)
 *   3. recordUpload(formData with path)  → { id }
 *
 * Media stays 'pending' (quarantined) until an admin approves it in the
 * moderation queue (Batch E). Signed download URLs are issued ONLY for
 * 'approved' media. SAFE-2 replaces scanMedia stub with PhotoDNA/NCMEC.
 */
export async function requestUpload(
  formData: FormData,
): Promise<{ ok: boolean; path?: string; signedUrl?: string; token?: string; error?: string }> {
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { accountId, profile } = ctx;

  // Sanitize the filename to safe path characters only.
  const rawName = (formData.get("filename") as string | null) ?? "upload";
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const path = `${accountId}/${profile.id}/${Date.now()}-${safeName}`;

  const signed = await signUpload(path);
  if (!signed) return { ok: false, error: "unconfigured" };

  return { ok: true, path, signedUrl: signed.signedUrl, token: signed.token };
}

/**
 * Step 3 of the client upload flow.
 * Called after the file has been PUT to Storage; records the media row as 'pending'.
 * is_minor is derived from the profile kind so the caller cannot spoof it.
 */
export async function recordUpload(
  formData: FormData,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { accountId, profile } = ctx;

  const path = (formData.get("path") as string | null) ?? "";
  const mime = (formData.get("mime") as string | null) ?? null;
  const bytesRaw = formData.get("bytes");
  const bytes = bytesRaw !== null ? Number(bytesRaw) : null;
  const postIdRaw = formData.get("postId") as string | null;
  const postId = postIdRaw && postIdRaw.length > 0 ? postIdRaw : null;

  if (!path) return { ok: false, error: "missing_path" };
  // Defense-in-depth: the path must be within this profile's own upload prefix
  // (requestUpload builds `${accountId}/${profile.id}/...`), so a client can't
  // record a media row pointing at another account's object.
  if (!path.startsWith(`${accountId}/${profile.id}/`)) return { ok: false, error: "bad_path" };

  const isMinor = profile.kind === "child";

  try {
    const id = await createMedia(accountId, profile.id, postId, path, mime, bytes, isMinor);
    const { scanAndAct } = await import("@/lib/moderation/scan");
    try { await scanAndAct(accountId, id, path); } catch { /* media stays pending; never block on scan */ }
    return { ok: true, id };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}
