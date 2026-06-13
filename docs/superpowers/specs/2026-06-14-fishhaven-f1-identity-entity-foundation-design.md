# FishHaven F1 — Identity & Entity Foundation (Design Spec)

**Date:** 2026-06-14
**Sub-project:** F1 of the FishHaven × Micya foundation roadmap
(`2026-06-14-fishhaven-micya-foundation-roadmap.md`).
**Status:** Approved design; ready for implementation planning.

## Goal

Establish the identity foundation for FishHaven: one parent login owns a
household of multiple profiles (parent + children), selected through a profile
picker with optional per-profile PINs, with the parent admin zone always locked.
Fold in the outstanding production-audit fixes and rebrand Haven Kids →
FishHaven. Tables are concrete but **entity-aware** so sub-project F2 can
generalize them (Person/Household → the `entities`/`relationships` model)
without a rewrite.

## Scope

### In scope
- Household + multi-profile data model and RPCs.
- Parent login (Google OAuth + email magic-link) → profile picker → optional
  per-profile PIN → in-app as the active profile.
- Parent zone (admin) always locked behind a household-level parent credential;
  the parent is also a usable profile.
- Re-key activity from `email` to `person_id`; add the missing
  `log_activity` / `my_activity` RPCs.
- Persist strikes / moderation server-side.
- Auth hardening: remove demo provider, drop
  `allowDangerousEmailAccountLinking`, add security headers + rate limiting,
  add ESLint config.
- Rebrand Haven Kids → FishHaven across UI, copy, metadata, README,
  `package.json`.

### Out of scope (later sub-projects)
- The generic `entities` / `relationships` schema and ontology (F2).
- The nine-scope permission model (F3) — F1 uses straightforward
  household-ownership RLS only.
- Persisting posts/comments/messages content (C4) — F1 persists activity +
  strikes only; community content stays seed-data for now.
- Any AI / retrieval / refinery work (C5+).
- Per-kid independent direct logins (explicitly decided against; parent login is
  the only authentication boundary).

## Decisions (locked during brainstorming)

1. **Profile auth model:** parent login + profile picker (Netflix-style). Kids
   never authenticate independently.
2. **PIN scope:** optional per-profile PIN; parent zone always locked.
3. **Parent role:** the parent is also a usable profile *and* holds admin access
   to the parent zone.
4. **Demo login:** removed entirely.
5. **Session mechanism:** signed, httpOnly active-profile cookie (no per-profile
   tokens, no DB session rows).

## Data model

All tables in `public`, RLS enabled, privileged writes via `SECURITY DEFINER`
RPCs (consistent with the existing anon-client + RPC pattern in
`lib/supabase.ts`).

**Authorization model.** The app uses the anon key with no Supabase-Auth user
JWT, so `auth.jwt()`-based RLS policies do not meaningfully apply to the app
path. RLS therefore blocks all *direct* anon reads/writes (defense in depth),
and the real trust boundary is the **Next.js server**: every RPC call is made
only after the server has (a) resolved the Auth.js account, (b) read the signed
`fh_active_profile` cookie, and (c) confirmed that `person_id` belongs to the
account's household. RPCs are `SECURITY DEFINER` and authorize strictly on the
`person_id` the trusted server passes — they are never called from the client.

### `households`
| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `owner_email` | `text` unique not null | the Auth.js account email |
| `parent_pin_hash` | `text` not null | scrypt hash; gates the parent zone |
| `created_at` | `timestamptz` default `now()` | |

= the future `Family` permission scope.

### `people` (profiles)
| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `household_id` | `uuid` not null → `households(id)` on delete cascade | |
| `kind` | `text` not null | `'parent' \| 'child'`; the F2 entity discriminator |
| `display_name` | `text` not null | |
| `avatar` | `text` not null | emoji / icon key |
| `pin_hash` | `text` null | null = no PIN on this profile |
| `birth_year` | `int` null | optional, for age-appropriate features later |
| `created_at` | `timestamptz` default `now()` | |

= the future `Person` entity. Exactly one `kind='parent'` row per household
(the account owner's own profile); enforced by a partial unique index.

### `activity` (re-keyed)
Replace the `email text` column with `person_id uuid not null → people(id)`.
Indexes re-keyed to `(person_id, created_at desc)` and
`(event, created_at desc)`.

### `strikes`
| column | type | notes |
|---|---|---|
| `id` | `bigserial` pk | |
| `person_id` | `uuid` not null → `people(id)` on delete cascade | |
| `reason` | `text` not null | |
| `created_at` | `timestamptz` default `now()` | |
| `cleared_at` | `timestamptz` null | null = active strike |

Active strike count = `count(*) where cleared_at is null`. Replaces the
client-side `strikes` React state.

### RPCs (`SECURITY DEFINER`)
- `create_household(p_email, p_parent_pin)` → creates household + the parent
  `people` row; returns ids.
- `create_profile(p_household_id, p_kind, p_name, p_avatar, p_pin)` → adds a
  profile (PIN optional; hashed in-RPC).
- `verify_profile_pin(p_person_id, p_pin)` → boolean.
- `verify_parent_pin(p_household_id, p_pin)` → boolean.
- `list_profiles(p_household_id)` → profiles for the picker (no hashes).
- `log_activity(p_person_id, p_event, p_data, p_user_agent)` — **new**, replaces
  the missing email-keyed version.
- `my_activity(p_person_id, p_limit)` — **new**.
- `add_strike(p_person_id, p_reason)` / `clear_strikes(p_person_id)` /
  `active_strikes(p_person_id)`.

PIN hashing uses `pgcrypto`/scrypt inside the RPCs; PINs never leave the DB in
plaintext and are never returned.

## Auth & session flow

1. **Login** (`/login`): Google OAuth or email magic-link via Auth.js
   (unchanged mechanism — Supabase Auth is *not* used; the consent screen is
   branded by Google Cloud Console, the Supabase project is never shown). On
   first successful login with no household for that email → run
   `create_household` (prompt for a parent PIN as part of onboarding).
2. **Profile picker** (`/app/profiles`): server component calls
   `list_profiles`. Renders profile cards + "Add profile" + "Enter parent zone."
3. **Pick a profile:** a server action. If the profile has a `pin_hash`, prompt
   for the PIN and `verify_profile_pin` server-side; on success set the signed,
   httpOnly `fh_active_profile` cookie to the `person_id`. On failure, throttled
   retry.
4. **In-app** (`/app/*`): a server check reads `fh_active_profile`, resolves the
   person, and confirms the person's `household_id` matches the logged-in
   account's household. Missing/invalid cookie → redirect to `/app/profiles`.
   `HavenApp` and the activity logger use the active `person_id`. The
   `/api/activity` route independently re-derives `person_id` from the signed
   cookie and re-confirms household membership before calling `log_activity`,
   so a forged request cannot write activity for another household's profile.
5. **Parent zone** (`/app/parents/*`): independent gate — requires
   `verify_parent_pin` for the household regardless of the active profile, so a
   child profile can never reach admin. A short-lived signed
   `fh_parent_unlock` cookie avoids re-prompting within a session.
6. **Switch profile / sign out:** "Switch profile" clears `fh_active_profile`
   and returns to the picker; sign out clears all cookies and the Auth.js
   session.

### Cookies
- `fh_active_profile` — httpOnly, secure, signed (HMAC with `AUTH_SECRET`),
  `SameSite=Lax`, session-scoped. Holds `person_id`.
- `fh_parent_unlock` — httpOnly, secure, signed, 30-minute TTL. Holds
  `household_id` + issued-at.

## Auth hardening / audit fixes

- **Remove** the demo Credentials provider from `auth.ts` and its UI block in
  `app/login/page.tsx`.
- **Remove** `allowDangerousEmailAccountLinking: true` from the Google provider.
- **Security headers** via `next.config.ts` / middleware: CSP, HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`.
- **Rate limiting** on `/api/activity` and the auth/PIN server actions (simple
  in-memory token bucket keyed by IP+account for now; a durable store is a later
  concern).
- **ESLint**: add `eslint` + `eslint-config-next` and an `.eslintrc` so the
  existing `lint` script works.
- **Schema fix**: add the previously-missing `log_activity` / `my_activity`
  RPCs (now `person_id`-keyed) to `supabase/schema.sql`; the script stays
  idempotent.

## Rebrand (Haven Kids → FishHaven)

UI copy and headings, `app/layout.tsx` metadata/title, the login screen, README,
`package.json` `"name": "fishhaven"`, and any "Haven Kids" string in components.
Keep the existing visual style/theme; this is a name change, not a redesign.

## Error handling

| Situation | Behavior |
|---|---|
| Wrong profile PIN | Friendly retry; after 5 failed attempts, lock that profile's PIN entry for 60s |
| Wrong parent PIN | Same; parent zone stays locked |
| Missing/invalid `fh_active_profile` | Redirect to `/app/profiles` |
| Active person not in account's household | Clear cookie, redirect to picker |
| Supabase not configured | App still boots; activity/strikes degrade
  gracefully (preserve current behavior) |
| Login but no household yet | Onboarding: create household + parent PIN + first
  profile |

## Testing

- **RPC tests:** household/profile creation, PIN verify (correct/incorrect),
  activity re-keying (`log_activity` → `my_activity` round-trip), strike
  add/clear/count.
- **Server-action / integration tests:** profile pick sets the cookie only on
  correct PIN; parent zone blocked without `verify_parent_pin`; child profile
  cannot reach `/app/parents`; invalid active-profile cookie redirects.
- **Regression:** app boots with Supabase unconfigured; `npm run build`,
  `npm run typecheck`, and `npm run lint` all pass.

## Affected files (indicative)

- `auth.ts` — remove demo provider, drop dangerous linking, onboarding hook.
- `app/login/page.tsx` — remove demo block, rebrand copy.
- `app/app/page.tsx`, `components/HavenApp.tsx` — use active `person_id`.
- `app/app/profiles/*` (new) — picker + PIN flow + server actions.
- `app/app/parents/*` — parent-zone gate.
- `lib/supabase.ts`, `lib/activity.ts` — person-id keyed calls.
- `supabase/schema.sql` — new tables + RPCs.
- `middleware.ts`, `next.config.ts` — security headers, rate limiting.
- `.eslintrc*`, `package.json` — ESLint, rename.
- `README.md`, `app/layout.tsx` — rebrand.

## Forward-compatibility with F2

`people.kind` is the entity-type discriminator F2 generalizes; `households` is
the `Family` scope F3 formalizes; the `activity` table is the Raw-Layer feedstock
C4/C5 consume. No F1 choice blocks the generic `entities`/`relationships` model.
