import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "media";

/** A signed URL the client can PUT the file to (no public bucket access). */
export async function signUpload(path: string) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);
  return data; // { signedUrl, token, path }
}

/** Short-lived signed download URL — call ONLY for approved media. */
export async function signedDownload(path: string, expiresInSec = 300) {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresInSec);
  if (error) throw new Error(error.message);
  return data?.signedUrl ?? null;
}

/** Content scan hook. STUB: everything stays 'pending' for manual review.
 *  SAFE-2 replaces this with PhotoDNA/Thorn/Cloudflare → 'approved'/'rejected' + NCMEC on a hit. */
export async function scanMedia(_path: string): Promise<"pending" | "approved" | "rejected"> {
  return "pending";
}
