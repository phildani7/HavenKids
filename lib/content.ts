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
