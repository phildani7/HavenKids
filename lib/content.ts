import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";

export type FeedPost = {
  id: string;
  body: string;
  created_at: string;
  author_person_id: string;
  author_name: string;
  author_avatar: string;
};

export type FeedComment = {
  id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_avatar: string;
};

export async function createPost(
  accountId: string,
  authorPersonId: string,
  communityId: string,
  body: string,
): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("create_post", {
    p_account_id: accountId,
    p_author_person_id: authorPersonId,
    p_community_id: communityId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listPosts(
  communityId: string,
  limit = 50,
): Promise<FeedPost[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_posts", {
    p_community_id: communityId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedPost[];
}

export async function addComment(
  accountId: string,
  authorPersonId: string,
  postId: string,
  body: string,
): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("add_comment", {
    p_account_id: accountId,
    p_author_person_id: authorPersonId,
    p_post_id: postId,
    p_body: body,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listComments(
  postId: string,
  limit = 100,
): Promise<FeedComment[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_comments", {
    p_post_id: postId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedComment[];
}

export async function hidePost(accountId: string, postId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("hide_post", {
    p_account_id: accountId,
    p_post_id: postId,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// C4 Media wrappers
// ---------------------------------------------------------------------------

/** Record a newly uploaded file as 'pending'. Throws if the uploader is not permitted. */
export async function createMedia(
  accountId: string,
  ownerPersonId: string,
  postId: string | null,
  path: string,
  mime: string | null,
  bytes: number | null,
  isMinor: boolean,
): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { data, error } = await sb.rpc("create_media", {
    p_account_id: accountId,
    p_owner_person_id: ownerPersonId,
    p_post_id: postId ?? null,
    p_path: path,
    p_mime: mime ?? null,
    p_bytes: bytes ?? null,
    p_is_minor: isMinor,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export type PendingMediaRow = {
  id: string;
  owner_person_id: string;
  path: string;
  mime: string | null;
  is_minor: boolean;
  created_at: string;
};

/** List all pending (quarantined) media for an account. Used by the moderation queue (Batch E). */
export async function listPendingMedia(accountId: string): Promise<PendingMediaRow[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_pending_media", {
    p_account_id: accountId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PendingMediaRow[];
}

/** Approve or reject a media item (account-scoped guardian review; platform-wide review arrives in SAFE-2). */
export async function setMediaStatus(
  accountId: string,
  mediaId: string,
  status: "pending" | "approved" | "rejected",
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("set_media_status", {
    p_account_id: accountId,
    p_media_id: mediaId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}

/** Signed download URL for an approved media item. Never call this for pending/rejected media. */
export { signedDownload as mediaSignedUrl } from "@/lib/media";

// ---------------------------------------------------------------------------
// SAFE-2: scan verdict + incidents
// ---------------------------------------------------------------------------

/**
 * Apply an automated scan verdict to a media item.
 * The DB RPC handles the state machine:
 *   clean  → approved
 *   csam   → rejected + incident + NCMEC report row
 *   review → stays pending (manual review queue)
 */
export async function setMediaVerdict(
  accountId: string,
  mediaId: string,
  provider: string,
  verdict: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("set_media_verdict", {
    p_account_id: accountId,
    p_media_id: mediaId,
    p_provider: provider,
    p_verdict: verdict,
  });
  if (error) throw new Error(error.message);
}

export type Incident = {
  id: string;
  kind: string;
  status: string;
  media_id: string | null;
  created_at: string;
};

/** List safety incidents for an account. Returns [] if Supabase is not configured. */
export async function listIncidents(accountId: string): Promise<Incident[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_incidents", {
    p_account_id: accountId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Incident[];
}
