# SAFE-1 — Age Assurance, Parental Consent & Controls (Design Spec)

**Date:** 2026-06-16 · **Gates:** kid-facing launch. · **Builds on:** F1 (accounts/people/admin zone), SAFE-0 rules.

> ⚖️ Implements SAFE-0 rules R1–R9, R14–R16. **[LEGAL]** items inherit from
> `docs/superpowers/safe-0/00-compliance-foundation.md`. Jurisdiction: India + US + RoW, **UK/EU excluded**.

## Goal
Make a child profile **legally usable**: a parent records verifiable consent before the
child profile activates; the child's data is minimal and never tracked; the parent can
see/export/correct/delete it and revoke consent; UK/EU are geo-blocked. All under-18 are
treated as children (India DPDP bar).

## Scope
**In:** consent capture + immutable record + revoke; per-child age band; child-profile
activation gating (inactive until consent); parental data dashboard (view/export/delete) in
the admin zone; retention/erasure; UK/EU geo-restriction; consent/data audit log.
**Out (later SAFE):** CSAM scanning + NCMEC (SAFE-2); DM/contact safety (SAFE-3); a
third-party VPC vendor integration (designed-for, not built — see Consent method).

## Decisions
- **Child = under 18** → one consent rule for all minors.
- **Consent method (MVP):** the parent is already account-authenticated; consent is an
  **explicit, logged affirmative step** (review notice version + attestation) recorded
  immutably. The `method` is a stored field so a stronger/certified VPC (e.g. k-ID/PRIVO)
  can be swapped in **without schema change**. **[LEGAL: confirm this suffices for India <18 + US <13.]**
- **Inactive-until-consent:** a child profile cannot be selected or process activity until a
  current (non-revoked) consent exists.
- **No new auth machinery** — extends the F1 admin zone + C1 guards.

## Data model (extends F1; verify on real Supabase per the F1 pattern)

### `people` — add
- `age_band text` `check (age_band in ('under_13','13_17','adult'))`, default `'adult'`.
  Children carry `under_13` / `13_17` (drives COPPA-specific handling + safety rules).

### `consents` (new — immutable append; revoke sets `revoked_at`)
| col | type | notes |
|---|---|---|
| `id` | uuid pk | |
| `account_id` | uuid → accounts | |
| `person_id` | uuid → people | the child |
| `scope` | text | what was consented (e.g. `'service_v1'`) |
| `method` | text | `'parent_attestation_v1'` (swappable) |
| `notice_version` | text | version of the notice consented to |
| `country` | text | geo at consent time |
| `created_at` | timestamptz | |
| `revoked_at` | timestamptz null | null = current/active |

A child profile **is active** iff `exists(consent where person_id=… and revoked_at is null)`.

### `safety_audit` (new — append-only)
`id, account_id, actor_person_id, action, target_person_id, detail jsonb, created_at`.
Logs consent grant/revoke, data export, deletion. (Foundation SAFE-2/3 also write to it.)

### RPCs (service-role only, `search_path = public, extensions`)
- `record_consent(p_account_id, p_person_id, p_scope, p_method, p_notice_version, p_country)` → inserts consent + audit row. Verifies person∈account, kind='child'.
- `revoke_consent(p_account_id, p_person_id)` → set `revoked_at=now()` on current consent + audit; caller then erases (below).
- `child_is_active(p_person_id)` → boolean (current consent exists).
- `export_child_data(p_account_id, p_person_id)` → jsonb bundle (profile + activity + strikes + consents) for parental access/portability (R8).
- `delete_child_data(p_account_id, p_person_id, p_keep_profile boolean)` → erase activity + strikes (+ profile if not keep); **retain** consents (proof) and any safety incidents. Audit it.
- `list_profiles` — extend to return `age_band` and `is_active` (no hashes, no consent internals).
- `create_profile` (child path) — unchanged except it no longer implies usable; profile stays inactive until `record_consent`.

## Flows
1. **Add child (admin zone, adult + admin-unlock):** parent enters name/avatar/age-band → sees the **kid + parent notice** + attestation checkbox → submits → `create_profile` (if new) + `record_consent(method='parent_attestation_v1', notice_version, country)`. Profile becomes active.
2. **Activation gate:** `pickProfile` and `/app` reject a child profile with no current consent → bounce to a "needs parent consent" state (the picker shows such profiles as locked/pending, not selectable). `resolveActiveProfile` treats inactive children as unusable.
3. **Parental data dashboard (`/app/admin`):** per child — **Consent status** (granted/revoked, when) with **Revoke**; **Export** (download the `export_child_data` JSON); **Delete** (calls `delete_child_data`, which also revokes consent). All behind `requireActiveAdult` + `requireAdminUnlock`.
4. **Revoke/delete:** revoke → child profile deactivates immediately; delete → child PII erased (consent proof + incidents retained per R14).

## Geo-restriction (R16)
- Middleware geo gate: read the request country (Vercel `request.geo.country`; documented fallback when unavailable). **Block UK + EEA** country codes → render a "not available in your region" page; deny `/app` and signup.
- Record `country` on the consent record. Best-effort (VPNs) — documented limitation. **[LEGAL]**

## No-tracking defaults (R7)
- No third-party analytics/trackers/ad SDKs on any surface. First-party `activity` only, and for children it stays first-party + parent-visible. Document as a standing rule; add a lint/CI note if a tracker dep is introduced.

## Authorization
All new server actions go through the F1 `lib/guards.ts` (`requireActiveAdult` + `requireAdminUnlock`); RPCs are service-role only. Consent/data actions target a child the guard confirms belongs to the account.

## Testing
- **pgTAP:** record_consent (person∈account, child-only), child_is_active before/after consent + after revoke, export bundle shape, delete_child_data erases activity/strikes but keeps consents, list_profiles returns age_band + is_active and no hashes. Verify on **real Supabase** (rolled-back tx) like F1.
- **Vitest:** geo-restriction country logic (allow/deny lists), consent-gating helpers.
- **Integration/manual:** add child → consent → child usable; revoke → child locked + data erased; export downloads JSON; UK/EU IP blocked.

## [LEGAL] flags (carried from SAFE-0)
VPC method sufficiency; grievance officer; multilingual notice; breach timelines; retention windows; final DPDP Rules. The consent `method`/`notice_version` fields make upgrading painless.

## Affected files (indicative)
- `supabase/migrations/*_safe1_consent.sql`, `supabase/schema.sql`, `supabase/tests/*` — new tables + RPCs + tests.
- `lib/accounts.ts` — consent/export/delete/age-band wrappers.
- `app/app/admin/*` — consent step on add-child; data dashboard (export/delete/revoke).
- `app/app/profiles/*`, `app/app/page.tsx`, `lib/guards.ts` — activation gating for children.
- `middleware.ts` (or a geo util) — UK/EU geo-restriction; a region-blocked page.
- Notices wired in: render `safe-0/privacy-notice-*.md` content at the consent step.
