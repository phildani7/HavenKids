# C4 Batches B + C: Shared Moderation + Content Server Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement shared server-authoritative text moderation (`lib/moderation/text.ts`), refactor `moderateMessage` in chat to use it, and create the content service layer (`lib/content.ts` + `app/app/content/actions.ts`) with child-consent and moderation gating.

**Architecture:** The moderation module is a pure server-only utility (no Supabase, no auth) so it can be unit-tested in isolation with Vitest. The content layer follows the exact pattern of `lib/accounts.ts` — service-role Supabase wrappers that throw on error — and the server actions follow `app/app/chat/actions.ts` — `"use server"`, auth via `auth()`, profile resolution via guards, result objects (no redirects).

**Tech Stack:** Next.js 14 App Router, Vitest, Supabase service-role client, TypeScript strict mode.

## Global Constraints

- Branch: `f1-identity-foundation`
- Working directory: `/Users/pd7m/CC/FishHaven/HavenKids`
- All new server-only files must begin with `import "server-only";`
- Server actions must begin with `"use server";`
- Never expose service-role key to the browser
- `getSupabaseAdmin()` returns `null` when env vars are missing — use safe defaults (`[]`, `null`) when null, throw only when null means "can't proceed" (write path)
- No redirects from content actions — return result objects so client UI can show inline errors
- TypeScript aliases: `@/lib/...`, `@/app/...` (tsconfig paths)
- Verify commands: `npm run typecheck && npm test && npm run build && npm run lint`
- Commit the docs/superpowers/c4-build-notes.md file is already tracked — do NOT re-create it

---

## File Map

| File | Status | Responsibility |
|------|--------|----------------|
| `lib/moderation/text.ts` | Create | Pure moderation logic — `moderateText(text)` function + `FLAGS` array |
| `lib/moderation/text.test.ts` | Create | Vitest unit tests — flagged words, case-insensitive, clean text, empty string |
| `app/app/chat/actions.ts` | Modify | Remove inline `FLAGS`; import + use `moderateText`; keep strike logic unchanged |
| `lib/content.ts` | Create | Service-role Supabase wrappers: `createPost`, `listPosts`, `addComment`, `listComments`, `hidePost` |
| `app/app/content/actions.ts` | Create | Server actions: `activeContext()` helper, `createPostAction(formData)`, `addCommentAction(formData)` |

---

## Task 1: Create `lib/moderation/text.ts` and its Vitest suite

**Files:**
- Create: `lib/moderation/text.ts`
- Create: `lib/moderation/text.test.ts`

**Interfaces:**
- Produces: `moderateText(text: string): { flagged: boolean; word?: string }` (exported from `lib/moderation/text.ts`)

- [ ] **Step 1: Create the moderation module**

Create `/Users/pd7m/CC/FishHaven/HavenKids/lib/moderation/text.ts` with the exact content below:

```ts
import "server-only";

// Server-authoritative text moderation. Shared by chat, posts, and comments.
// SAFE-2 will replace the blocklist with a real classifier.
const FLAGS = ["dumb", "stupid", "hate", "shut up"];

export function moderateText(text: string): { flagged: boolean; word?: string } {
  const low = (text || "").toLowerCase();
  const word = FLAGS.find((f) => low.includes(f));
  return word ? { flagged: true, word } : { flagged: false };
}
```

- [ ] **Step 2: Create the Vitest test file**

Create `/Users/pd7m/CC/FishHaven/HavenKids/lib/moderation/text.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

// "server-only" throws in a Node test environment because it checks for a
// Next.js-specific module condition. Mock it before importing the module.
vi.mock("server-only", () => ({}));

import { moderateText } from "./text";

describe("moderateText", () => {
  it("flags a word in the list", () => {
    const result = moderateText("you are so dumb");
    expect(result).toEqual({ flagged: true, word: "dumb" });
  });

  it("is case-insensitive", () => {
    expect(moderateText("I HATE this")).toEqual({ flagged: true, word: "hate" });
    expect(moderateText("STUPID idea")).toEqual({ flagged: true, word: "stupid" });
    expect(moderateText("Shut Up already")).toEqual({ flagged: true, word: "shut up" });
  });

  it("passes clean text", () => {
    expect(moderateText("Hello, this is a kind message")).toEqual({ flagged: false });
  });

  it("passes an empty string", () => {
    expect(moderateText("")).toEqual({ flagged: false });
  });

  it("returns the first matching flagged word when multiple flags present", () => {
    const result = moderateText("dumb and stupid");
    expect(result.flagged).toBe(true);
    expect(result.word).toBe("dumb");
  });
});
```

- [ ] **Step 3: Run the tests to verify they pass**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm test -- lib/moderation/text.test.ts
```

Expected: All 5 tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && git add lib/moderation/text.ts lib/moderation/text.test.ts && git commit -m "feat(c4-b): shared text moderation module with vitest"
```

---

## Task 2: Refactor `app/app/chat/actions.ts` to use `moderateText`

**Files:**
- Modify: `app/app/chat/actions.ts`

**Interfaces:**
- Consumes: `moderateText(text: string): { flagged: boolean; word?: string }` from `@/lib/moderation/text`
- Produces: `moderateMessage(text: string): Promise<{ flagged: boolean; word?: string }>` (unchanged public interface)

The current file has a local `FLAGS` array and inline match logic. Replace both with the shared module. The strike-recording block stays intact — only the detection logic moves.

- [ ] **Step 1: Replace `app/app/chat/actions.ts` content**

Write `/Users/pd7m/CC/FishHaven/HavenKids/app/app/chat/actions.ts`:

```ts
"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike } from "@/lib/accounts";
import { moderateText } from "@/lib/moderation/text";

// Server-authoritative moderation. Detection AND strike recording happen here,
// not in the browser, so a tampered client cannot fabricate or evade strikes.
export async function moderateMessage(text: string): Promise<{ flagged: boolean; word?: string }> {
  const { flagged, word } = moderateText(text);
  if (!flagged) return { flagged: false };

  // Record the strike against the active profile, derived from the signed
  // session/cookie (never client input).
  const session = await auth();
  if (session?.user?.email) {
    const accountId = await accountIdForEmail(session.user.email);
    if (accountId) {
      const profile = await resolveActiveProfile(accountId);
      if (profile) await addStrike(profile.id, `unkind word: ${word}`);
    }
  }
  return { flagged: true, word };
}
```

- [ ] **Step 2: Run typecheck to verify no type errors**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm run typecheck
```

Expected: Exit 0, no errors.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm test
```

Expected: All existing tests pass, including the new moderation tests.

- [ ] **Step 4: Commit**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && git add app/app/chat/actions.ts && git commit -m "refactor(c4-b): chat moderateMessage delegates to shared moderateText"
```

---

## Task 3: Create `lib/content.ts` — service-role Supabase content wrappers

**Files:**
- Create: `lib/content.ts`

**Interfaces:**
- Consumes: `getSupabaseAdmin()` from `@/lib/supabase`
- Produces:
  - `type FeedPost = { id: string; body: string; created_at: string; author_person_id: string; author_name: string; author_avatar: string }`
  - `type FeedComment = { id: string; body: string; created_at: string; author_name: string; author_avatar: string }`
  - `createPost(accountId: string, authorPersonId: string, communityId: string, body: string): Promise<string>` — returns new post id
  - `listPosts(communityId: string, limit?: number): Promise<FeedPost[]>`
  - `addComment(accountId: string, authorPersonId: string, postId: string, body: string): Promise<string>` — returns new comment id
  - `listComments(postId: string, limit?: number): Promise<FeedComment[]>`
  - `hidePost(accountId: string, postId: string): Promise<void>`

- [ ] **Step 1: Create `lib/content.ts`**

Create `/Users/pd7m/CC/FishHaven/HavenKids/lib/content.ts`:

```ts
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

export async function listPosts(communityId: string, limit = 50): Promise<FeedPost[]> {
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

export async function listComments(postId: string, limit = 100): Promise<FeedComment[]> {
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
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm run typecheck
```

Expected: Exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && git add lib/content.ts && git commit -m "feat(c4-c): content service-role wrappers (createPost/listPosts/addComment/listComments/hidePost)"
```

---

## Task 4: Create `app/app/content/actions.ts` — server actions with moderation + consent gating

**Files:**
- Create: `app/app/content/actions.ts`

**Interfaces:**
- Consumes:
  - `auth()` from `@/auth`
  - `accountIdForEmail(email: string): Promise<string | null>` from `@/lib/accounts`
  - `resolveActiveProfile(accountId: string): Promise<Profile | null>` from `@/lib/accounts`
  - `addStrike(personId: string, reason: string): Promise<void>` from `@/lib/accounts`
  - `moderateText(text: string): { flagged: boolean; word?: string }` from `@/lib/moderation/text`
  - `createPost(...)`, `addComment(...)` from `@/lib/content`
- Produces:
  - `createPostAction(formData: FormData): Promise<{ ok: false; error: "empty" | "auth" | "flagged" | "notallowed" | string; word?: string } | { ok: true; id: string }>`
  - `addCommentAction(formData: FormData): Promise<{ ok: false; error: "empty" | "auth" | "flagged" | "notallowed" | string; word?: string } | { ok: true; id: string }>`

Key invariants:
- Body is trimmed; empty body returns `{ ok: false, error: "empty" }` without touching auth
- Auth failure returns `{ ok: false, error: "auth" }` — no redirect
- Flagged body: record strike server-side THEN return `{ ok: false, error: "flagged", word }` — do NOT create the post/comment
- RPC throws (e.g. `can_author` rejects non-consented child): return `{ ok: false, error: "notallowed" }`

- [ ] **Step 1: Create `app/app/content/actions.ts`**

Create `/Users/pd7m/CC/FishHaven/HavenKids/app/app/content/actions.ts`:

```ts
"use server";

import { auth } from "@/auth";
import { accountIdForEmail, resolveActiveProfile, addStrike, type Profile } from "@/lib/accounts";
import { moderateText } from "@/lib/moderation/text";
import { createPost, addComment } from "@/lib/content";

type ActiveContext = { accountId: string; profile: Profile };

/** Resolve the signed-in account and the active profile from the session.
 * No redirect — callers surface auth errors inline. */
async function activeContext(): Promise<ActiveContext | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return null;
  const accountId = await accountIdForEmail(email);
  if (!accountId) return null;
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return null;
  return { accountId, profile };
}

type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "empty" | "auth" | "flagged" | "notallowed" | string; word?: string };

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const communityId = (formData.get("communityId") as string | null) ?? "";
  const body = ((formData.get("body") as string | null) ?? "").trim();

  if (!body) return { ok: false, error: "empty" };

  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { flagged, word } = moderateText(body);
  if (flagged) {
    await addStrike(ctx.profile.id, `unkind word: ${word}`);
    return { ok: false, error: "flagged", word };
  }

  try {
    const id = await createPost(ctx.accountId, ctx.profile.id, communityId, body);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}

export async function addCommentAction(formData: FormData): Promise<ActionResult> {
  const postId = (formData.get("postId") as string | null) ?? "";
  const body = ((formData.get("body") as string | null) ?? "").trim();

  if (!body) return { ok: false, error: "empty" };

  const ctx = await activeContext();
  if (!ctx) return { ok: false, error: "auth" };

  const { flagged, word } = moderateText(body);
  if (flagged) {
    await addStrike(ctx.profile.id, `unkind word: ${word}`);
    return { ok: false, error: "flagged", word };
  }

  try {
    const id = await addComment(ctx.accountId, ctx.profile.id, postId, body);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "notallowed" };
  }
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm run typecheck
```

Expected: Exit 0.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && git add app/app/content/actions.ts && git commit -m "feat(c4-c): content server actions (createPostAction/addCommentAction) with moderation + consent gating"
```

---

## Task 5: Final verification + update build notes

**Files:**
- Modify: `docs/superpowers/c4-build-notes.md` (mark Batch B and C done)

- [ ] **Step 1: Run full verification suite**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && npm run typecheck && npm test && npm run build && npm run lint
```

Expected: All four commands exit 0. If `npm run build` fails on a missing environment variable, that is expected in CI without Supabase creds — check that the only failures are env-related, not type/logic errors.

- [ ] **Step 2: Mark Batch B and C done in build notes**

Edit `/Users/pd7m/CC/FishHaven/HavenKids/docs/superpowers/c4-build-notes.md` — change:

```
- [ ] **Batch B — shared moderation** `lib/moderation/text.ts` (`moderateText`); refactor `app/app/chat/actions.ts moderateMessage` to use it. Vitest.
- [ ] **Batch C — content server layer** `lib/content.ts` (createPost/listPosts/addComment/listComments/hidePost wrappers, service-role) + `app/app/content/actions.ts` (resolve active profile via F1 guards → moderateText → strike+reject on flag → RPC; child must be consent-active, surfaced by `can_author` which throws).
```

to:

```
- [x] **Batch B — shared moderation** `lib/moderation/text.ts` (`moderateText`); refactor `app/app/chat/actions.ts moderateMessage` to use it. Vitest.
- [x] **Batch C — content server layer** `lib/content.ts` (createPost/listPosts/addComment/listComments/hidePost wrappers, service-role) + `app/app/content/actions.ts` (resolve active profile via F1 guards → moderateText → strike+reject on flag → RPC; child must be consent-active, surfaced by `can_author` which throws).
```

- [ ] **Step 3: Commit the plan + build notes + all remaining untracked files together**

```bash
cd /Users/pd7m/CC/FishHaven/HavenKids && git add docs/superpowers/c4-build-notes.md docs/superpowers/plans/2026-06-18-c4-batches-b-and-c.md && git commit -m "docs(c4): mark batches B+C complete in build notes"
```

---

## Self-Review Checklist

### Spec coverage
- [x] `lib/moderation/text.ts` — FLAGS constant, `moderateText` pure function, `import "server-only"`
- [x] `lib/moderation/text.test.ts` — flagged words, case-insensitive, clean text, empty string
- [x] Chat refactor — removes duplicate FLAGS, delegates to `moderateText`, strike behavior unchanged
- [x] `lib/content.ts` — all 5 RPC wrappers, service-role, throw on error, `[]` safe default for lists
- [x] `activeContext()` — session → email → accountId → resolveActiveProfile
- [x] `createPostAction` — empty guard, auth guard, moderate+strike+reject on flag, catch RPC throw → notallowed
- [x] `addCommentAction` — same shape as createPostAction
- [x] Result objects, not redirects
- [x] `revalidatePath` not called (spec says caller refetches)

### Type consistency
- `moderateText` returns `{ flagged: boolean; word?: string }` — used consistently in text.ts, chat/actions.ts, content/actions.ts
- `createPost` / `addComment` return `Promise<string>` (the new id) — `ActionResult` { ok: true; id: string } matches
- `Profile` type imported from `@/lib/accounts` (same source as guards.ts uses it)
- `activeContext()` returns `ActiveContext | null` — both actions handle null as `{ ok: false, error: "auth" }`

### No placeholders
- All steps contain complete code or exact commands
