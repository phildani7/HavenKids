"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike } from "@/lib/accounts";
import { moderateText } from "@/lib/moderation/text";
import { createPost, addComment } from "@/lib/content";

async function activeContext(): Promise<{ accountId: string; profile: Awaited<ReturnType<typeof resolveActiveProfile>> & object } | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const accountId = await accountIdForEmail(email);
  if (!accountId) return null;
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return null;
  return { accountId, profile };
}

export async function createPostAction(
  formData: FormData,
): Promise<{ ok: boolean; id?: string; error?: string; word?: string }> {
  const communityId = (formData.get("communityId") as string | null) ?? "";
  const body = ((formData.get("body") as string | null) ?? "").trim();

  if (!body) return { ok: false, error: "empty" };

  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { accountId, profile } = ctx;

  const { flagged, word } = moderateText(body);
  if (flagged) {
    await addStrike(profile.id, "unkind word: " + word);
    return { ok: false, error: "flagged", word };
  }

  try {
    const id = await createPost(accountId, profile.id, communityId, body);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}

export async function addCommentAction(
  formData: FormData,
): Promise<{ ok: boolean; id?: string; error?: string; word?: string }> {
  const postId = (formData.get("postId") as string | null) ?? "";
  const body = ((formData.get("body") as string | null) ?? "").trim();

  if (!body) return { ok: false, error: "empty" };

  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { accountId, profile } = ctx;

  const { flagged, word } = moderateText(body);
  if (flagged) {
    await addStrike(profile.id, "unkind word: " + word);
    return { ok: false, error: "flagged", word };
  }

  try {
    const id = await addComment(accountId, profile.id, postId, body);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}
