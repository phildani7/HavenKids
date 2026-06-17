# C4 — Raw Content Layer Implementation Plan

> REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD, frequent commits, verify DB on real Supabase.

**Goal:** Persisted, moderated community posts + comments + quarantined media uploads, replacing the seed feed. Spec: `docs/superpowers/specs/2026-06-16-c4-raw-content-layer-design.md`.

**Build order:** DB → shared moderation → posts/comments server layer → uploads (Storage) → UI wiring → verify.

## Batch A — DB (migration + pgTAP; verify on real Supabase)
Create `supabase/migrations/20260616010000_c4_content.sql` + `supabase/tests/c4_content.test.sql`; mirror into `schema.sql`.
- Tables: `posts`, `comments`, `media` (per spec); RLS on, no anon policies.
- RPCs (service-role, `search_path=public,extensions`): `create_post`, `list_posts`, `add_comment`, `list_comments`, `create_media`, `set_media_status`, `list_pending_media`, `hide_post`, `hide_comment`. `create_post`/`add_comment` reject when author∉account or (child && not consent-active via `child_is_active`). End with the `revoke/grant execute … to service_role` lockdown (new fns).
- pgTAP: author∈account enforced; child-not-consent-active rejected; list_posts returns author name/avatar; comment flow; media pending→approved via set_media_status; list_pending_media. Verify on real Supabase (rolled-back tx).

## Batch B — shared moderation
- `lib/moderation/text.ts`: `moderateText(text): {flagged, word?}` (blocklist moved from `app/app/chat/actions.ts`). Vitest. Refactor `moderateMessage` to use it (keep behavior).

## Batch C — posts/comments server layer
- `lib/content.ts`: service-role wrappers `createPost`, `listPosts`, `addComment`, `listComments`, `hidePost` (+ media wrappers in Batch D).
- `app/app/content/actions.ts`: `createPostAction(formData)` / `addCommentAction(formData)` — resolve active profile (F1 guards), run `moderateText` server-side (flag → record strike + reject), then call the RPC. Child must be consent-active.

## Batch D — uploads (Supabase Storage)
- Private bucket `media` (create via migration/SQL or document manual creation). `lib/media.ts`: `signUpload()` (signed upload URL), `recordMedia()` (→ create_media pending), `signedDownload(path)` (short-lived, only for approved), `scanMedia(path)` stub (returns pending; SAFE-2 swaps in). Kid uploads `is_minor=true` → quarantined.
- `app/app/content/media-actions.ts`: upload-init + record, guarded.

## Batch E — UI wiring
- Community feed (`CommunityPage` and/or `HomePage`) reads real `listPosts(communityId)`; composer (body + optional image) → actions; comment thread; pending-media shows "pending review" (kid: "your grown-up will see this"). Seed data fallback when Supabase unconfigured.
- Admin zone: a **moderation queue** (list_pending_media + hidden content) with approve/reject (set_media_status) — guarded; this is the SAFE-2 review seam.

## Batch F — verify + review
- typecheck/lint/test/build green; pgTAP on real Supabase; security/spec review (author auth, child-consent gating on writes, media quarantine + signed-URL-only serving, admin-only moderation).

## Notes
- Communities are opaque seed ids. Visibility = community-scoped MVP (F3 later). CSAM scan + NCMEC = SAFE-2 (hooks stubbed). New RPCs must re-run the execute lockdown.
