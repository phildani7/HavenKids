# C4 — Raw Content Layer (Design Spec, first slice)

**Date:** 2026-06-16 · **Builds on:** F1 (accounts/people/active-profile), SAFE-1 (consent gating), C2 (server-side moderation). · **Feeds:** C5 refinery (later).

> Replaces the client-side seed feed with **real, persisted, moderated content**: community
> **posts + comments + media uploads**. Communities are referenced by their existing **seed IDs**
> (real communities = F2, deferred). Permissions are community-scoped MVP (F3 deferred).

## Decisions
- **First slice:** posts + comments (text) **and** media uploads (Supabase Storage).
- **Communities:** `community_id text` = opaque seed id (no real communities table yet).
- **Uploads are quarantined:** private bucket, `pending` until a moderation hook clears them;
  served only via short-lived signed URLs once `approved`. The scan hook is a **stub now**;
  the real CSAM/image scan plugs in at **SAFE-2** without schema change. **Kid uploads start
  quarantined regardless** (visible to the author + their guardian, not public, until cleared).
- **Text moderation:** refactor C2's `moderateMessage` into a shared `lib/moderation` used by
  posts, comments, and chat — server-authoritative; records strikes for the author's profile.
- **Authorship:** the **active profile** (server-derived from the signed cookie + account), never
  client input. A **child author must be consent-active** (SAFE-1) or the write is rejected.

## Data model (Postgres; verify on real Supabase like prior batches)

### `posts`
| col | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `community_id` | text not null | opaque seed id |
| `account_id` | uuid → accounts | author's account |
| `author_person_id` | uuid → people | author profile |
| `body` | text not null | |
| `status` | text not null default `'visible'` | `visible \| hidden` (moderation) |
| `created_at` | timestamptz | |
indexes: `(community_id, created_at desc)`, `(author_person_id)`.

### `comments`
`id, post_id → posts(on delete cascade), account_id, author_person_id, body, status, created_at`.

### `media`
| col | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` / `owner_person_id` | uuid | uploader |
| `post_id` | uuid null → posts | optional attachment |
| `bucket` / `path` | text | Supabase Storage location (private bucket `media`) |
| `mime` / `bytes` | text / bigint | |
| `status` | text not null default `'pending'` | `pending \| approved \| rejected` |
| `is_minor` | boolean not null | author is a child → stays quarantined until reviewed |
| `created_at` | timestamptz | |

All tables RLS-enabled, no anon policies; access via `SECURITY DEFINER` RPCs (service-role), per the F1 pattern. New functions re-run the `revoke/grant execute … to service_role` lockdown.

### RPCs (service-role)
- `create_post(account, author_person, community_id, body)` → verifies author∈account + (if child) consent-active; inserts; returns id. (Caller runs text moderation first/after.)
- `list_posts(community_id, limit)` → visible posts + author display_name/avatar (no PII beyond profile name/avatar).
- `add_comment(account, author_person, post_id, body)` / `list_comments(post_id, limit)`.
- `create_media(account, owner_person, post_id, bucket, path, mime, bytes, is_minor)` → row in `pending`.
- `set_media_status(account, media_id, status)` → admin-only (moderation queue / SAFE-2).
- `list_pending_media(account)` → the **moderation queue** seed (also used by SAFE-2/guardian review).
- `hide_post` / `hide_comment(account, id)` → moderation (admin or author).

## Uploads (Supabase Storage)
- **Private bucket `media`** (no public read). Server issues a **signed upload URL**; client uploads; server records `create_media(... 'pending')`.
- Serving: only `approved` media is returned, via a **short-lived signed download URL** minted server-side. `pending`/kid media → not served publicly (author + guardian only).
- **Scan hook:** `lib/moderation/scanMedia(path)` — stub returns `pending` (manual review) now; SAFE-2 swaps in PhotoDNA/Thorn/Cloudflare → auto approve/reject + NCMEC on a hit. No schema change needed.

## Moderation (shared, server-side)
- `lib/moderation/text.ts`: the blocklist + check (moved from `app/app/chat/actions.ts`); `moderateText(text) → {flagged, word}`. `moderateMessage` (chat), `create_post`, `add_comment` all call it server-side; on flag → record a strike for the author + reject/hold the content. Chat keeps current behavior via the shared module.
- This makes the moderation one place to harden (SAFE-2 upgrades it to a real classifier).

## Authorization & safety
- Every write/read RPC is called only by the trusted server after `requireActiveProfile`-style resolution (active person ∈ account); reuse F1 `lib/guards`/`resolveActiveProfile`. Admin/moderation actions use `requireActiveAdult` + `requireAdminUnlock`.
- **Child authors:** `create_post`/`add_comment` reject if the child isn't consent-active (SAFE-1). Kid media is `is_minor=true` → quarantined.
- No tracking/profiling of minors (SAFE-0 R7) — posts/comments are first-party content only.

## UI wiring
- Community feed (`CommunityPage`/`HomePage`) reads **real `list_posts`** instead of seed `HAVEN_DATA` posts; a composer (post body + optional media) calls the server actions; a comment thread per post.
- An **upload control** (image) → signed upload → pending; shows "pending review" until approved (and for kids, "your grown-up will see this").
- Admin zone gains a **moderation queue** (pending media + hidden/flagged content) — the SAFE-2 review surface, seeded here.
- Seed data stays as a fallback when Supabase is unconfigured (graceful degradation, per existing pattern).

## Out of scope (later)
- Real communities + membership/roles (F2); fine-grained visibility/sharing (F3); the real CSAM scanner + NCMEC (SAFE-2 — hook is stubbed); realtime updates; reactions (keep seed/!persisted for now or a follow-up).

## Testing
- pgTAP: create_post (author∈account, child-must-be-consent-active rejection), list_posts, comments, media pending→approved, set_media_status admin-only, list_pending_media. Verify on real Supabase.
- Vitest: shared `moderateText`.
- Manual: post appears in feed; flagged word → strike + blocked; image upload → pending → (admin approve) → visible via signed URL; kid post requires consent-active; kid media quarantined.

## [SAFE-2 integration points] (stubbed now)
`scanMedia` hook; `list_pending_media` queue; `set_media_status`; NCMEC report on a scan hit. All present as seams so SAFE-2 is a plug-in, not a refactor.
