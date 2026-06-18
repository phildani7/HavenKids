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
- [ ] **Batch E — UI** feed reads `listPosts(communityId)` (replace seed `HAVEN_DATA` posts in CommunityPage/HomePage), composer, comments, upload control (pending state copy: kid = "your grown-up will see this"), admin moderation queue over `list_pending_media` (approve/reject). Seed fallback when Supabase unconfigured.
- [ ] **Batch F — verify + review** typecheck/lint/test/build; pgTAP on real Supabase; security/spec review (author auth, child-consent gating on writes, media quarantine + signed-URL-only serving, account-scoped moderation).

## Gotchas / invariants
- `can_author(account, person)` = in-account + not soft-deleted + (adult OR consent-active child). create_post/add_comment/create_media throw if false.
- Moderation queue + set_media_status are **account-scoped** (a guardian reviews their own household's pending media). Platform-wide moderation = F2 roles + SAFE-2.
- Storage bucket must be **private**; never return raw paths to the client — only short-lived signed URLs for `approved` media.
- Keep seed-data fallback when `getSupabaseAdmin()` is null (graceful degradation, matches existing pattern).
- New RPCs are covered by the lockdown block at the end of the migration/schema (don't forget on future additions).
