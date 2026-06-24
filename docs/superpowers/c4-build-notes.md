# C4 Build Notes (running log)

Spec: `specs/2026-06-16-c4-raw-content-layer-design.md` · Plan: `plans/2026-06-16-c4-raw-content-layer.md`
Branch: `f1-identity-foundation` (PR #1).

## Decisions
- First slice = posts + comments + uploads. Communities = opaque **seed ids** (real communities = F2, deferred).
- Uploads **quarantined**: private bucket, `pending` until a scan hook clears; signed-URL serving only when `approved`; kid uploads `is_minor=true`. Real CSAM scan = SAFE-2 (hook stubbed).
- Text moderation = shared server-side module; child must be **consent-active** (SAFE-1) to author.
- All RPCs service-role only; new RPCs must re-run `revoke/grant execute … to service_role`.

## Progress
- [x] **Batch A — DB** (commit `71647fb`). posts/comments/media + RPCs (`can_author`, `create_post`, `list_posts`, `add_comment`, `list_comments`, `create_media`, `set_media_status`, `list_pending_media`, `hide_post/hide_comment`). pgTAP `plan(10)`. **Verified on real Supabase** (rolled-back tx): adult posts; child blocked until consent-active then allowed; comments; media pending→approved; deleted child can't author.
- [x] **Batch B — shared moderation** (commit `355fe4a`). `lib/moderation/text.ts` `moderateText` (pure, no server-only so it's testable); chat refactored to use it (no behavior change). Vitest 4 tests. Total 14/14.
- [x] **Batch C — content server layer** (commit `355fe4a`). `lib/content.ts` (createPost/listPosts/addComment/listComments/hidePost, FeedPost/FeedComment types) + `app/app/content/actions.ts` (`createPostAction`/`addCommentAction`: `activeContext()` resolves account+active profile, moderate server-side → strike on flag → RPC, catch can_author throw → `notallowed`; return result objects, NOT redirects, so the composer shows inline errors).
- [x] **Batch D — uploads** (commit `5a506a1`). migration `20260616020000_c4_media_bucket.sql` (private bucket `media`); `lib/media.ts` (signUpload, signedDownload approved-only, scanMedia stub); `app/app/content/media-actions.ts` (requestUpload→signed URL, recordUpload→create_media pending, is_minor from kind); lib/content media wrappers (createMedia/listPendingMedia/setMediaStatus/mediaSignedUrl). Quarantine + signed-URL-only confirmed. build green.
- [x] **Batch E — UI** (commit `7def292`). `listPostsAction`/`listCommentsAction` read actions; `components/screens/CommunityFeed.tsx` (composer w/ inline moderation errors, post list, lazy comments, image upload→pending) slotted into CommunityPage ABOVE the seed demo content (seed kept as labelled demo); admin **pending-media moderation queue** (signed-URL thumbnails, Approve/Reject via approveMedia/rejectMedia guarded by requireActiveAdult+admin-unlock). Graceful empty state when unconfigured.
- [x] **Privacy pages** (commit `36ec557`): public `/privacy-parents` + `/privacy-kids` (fixes the dead consent-notice link; SAFE-1 R15 transparency).
- [x] **Batch F — review** (Opus). **No Critical/High holes.** Authorship always server-derived from the signed active-profile cookie (no client-settable author); child-consent gating enforced uniformly by `can_author` (throw surfaced); **media quarantine structurally guaranteed** (create_media always pending, bucket private, public feed serves no media, only admin pending-thumbnails served via short-lived signed URL behind admin-unlock). Admin moderation triple-gated. Applied the one Low defense-in-depth fix: `recordUpload` now validates `path` starts with `${accountId}/${profile.id}/`.

## C4 status: app layer COMPLETE (all batches A–F). Remaining = SAFE-2 (real CSAM scan replaces scanMedia stub + NCMEC) before kid uploads go live; realtime + reactions are follow-ups.

## Gotchas / invariants
- `can_author(account, person)` = in-account + not soft-deleted + (adult OR consent-active child). create_post/add_comment/create_media throw if false.
- Moderation queue + set_media_status are **account-scoped** (a guardian reviews their own household's pending media). Platform-wide moderation = F2 roles + SAFE-2.
- Storage bucket must be **private**; never return raw paths to the client — only short-lived signed URLs for `approved` media.
- Keep seed-data fallback when `getSupabaseAdmin()` is null (graceful degradation, matches existing pattern).
- New RPCs are covered by the lockdown block at the end of the migration/schema (don't forget on future additions).
