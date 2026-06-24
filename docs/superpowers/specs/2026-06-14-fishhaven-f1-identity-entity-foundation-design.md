# FishHaven F1 — Identity & Entity Foundation (Design Spec)

**Date:** 2026-06-14
**Sub-project:** F1 of the FishHaven × Micya foundation roadmap
(`2026-06-14-fishhaven-micya-foundation-roadmap.md`).
**Status:** Approved design; ready for implementation planning.

## Positioning

FishHaven is a community platform for **every Christian** — individuals,
families, and communities, all ages, kids included. It is *not* a kids-only app;
the children's experience is one safe mode within a general platform. The
identity model below reflects that: the common case is a **solo adult** with a
single profile; a **family** is simply an account that also has child profiles.

## Goal

Establish the identity foundation: one login owns an **account** with one or
more **profiles** (adults and/or children), selected through a profile picker
(skipped when there's only one), with optional per-profile PINs and an
admin/guardian zone that is PIN-locked whenever child profiles are present. Fold
in the outstanding production-audit fixes and rebrand Haven Kids → FishHaven.
Tables are concrete but **entity-aware** so sub-project F2 can generalize them
(Person/Account → the `entities`/`relationships` model) without a rewrite.

## Scope

### In scope
- Account + multi-profile data model and RPCs.
- Login (Google OAuth + email magic-link) → profile picker (auto-skipped for a
  single-profile account) → optional per-profile PIN → in-app as the active
  profile.
- Admin/guardian zone, PIN-locked when the account has any child profile; the
  account owner is also a usable profile.
- Re-key activity from `email` to `person_id`; add the missing
  `log_activity` / `my_activity` RPCs.
- Persist strikes / moderation server-side.
- Auth hardening: remove demo provider, drop
  `allowDangerousEmailAccountLinking`, add security headers + rate limiting,
  add ESLint config.
- Rebrand Haven Kids → FishHaven across UI, copy, metadata, README,
  `package.json` (all-ages framing, not kids-only).

### Out of scope (later sub-projects)
- The generic `entities` / `relationships` schema and ontology (F2).
- The nine-scope permission model (F3) — F1 uses straightforward
  account-ownership RLS only.
- Persisting posts/comments/messages content (C4) — F1 persists activity +
  strikes only; community content stays seed-data for now.
- Connections, favourites, DMs (S1).
- Any AI / retrieval / refinery work (C5+).
- Multiple owners per account (account-sharing between two adults) — future.
- Per-child independent direct logins (explicitly decided against; the account
  login is the only authentication boundary).

## Decisions (locked during brainstorming)

1. **Profile auth model:** account login + profile picker (Netflix-style).
   Children never authenticate independently. The picker is skipped when the
   account has exactly one profile.
2. **PIN scope:** optional per-profile PIN; the admin/guardian zone is locked
   whenever the account has any child profile.
3. **Owner role:** the account owner is also a usable (adult) profile *and*
   holds admin access to the admin/guardian zone.
4. **Demo login:** removed entirely.
5. **Session mechanism:** signed, httpOnly active-profile cookie (no per-profile
   tokens, no DB session rows).
6. **Audience:** all ages. Solo adult is the default shape; family (with child
   profiles) is the elaborated shape; both share one model.

## Data model

All tables in `public`, RLS enabled, privileged writes via `SECURITY DEFINER`
RPCs (consistent with the existing anon-client + RPC pattern in
`lib/supabase.ts`).

**Authorization model.** `SECURITY DEFINER` controls what a function *does*, not
who may *call* it — by default every `public` function is executable by the
`anon` role, and the anon key is public. Exposing `verify_admin_pin` /
`verify_profile_pin` to anon would allow offline-free PIN brute force, and
`create_account` could be spammed, all bypassing the Next.js server. Therefore
the migration **revokes EXECUTE on the F1 RPCs from `public`/`anon`/
`authenticated` and grants it only to `service_role`**. The server calls these
RPCs with the **server-only service-role key** (never the public anon key, never
the client). RLS is enabled on all tables with no anon policies, so direct
PostgREST reads/writes are denied too (defense in depth). The real trust boundary
is the **Next.js server**: every RPC call is made only after the server has
(a) resolved the Auth.js account, (b) read the signed `fh_active_profile` cookie,
and (c) confirmed that `person_id` belongs to the account. (This supersedes the
earlier "works with just the anon key" note — auth-sensitive RPCs require the
service-role key.)

### `accounts`
| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `owner_email` | `text` unique not null | the Auth.js account email |
| `admin_pin_hash` | `text` null | scrypt hash; gates the admin/guardian zone. Required once a child profile exists; optional for adult-only accounts |
| `created_at` | `timestamptz` default `now()` | |

= the future `Family`/account permission scope (an account with child profiles
maps to the `Family` scope; a solo adult is an account of one).

### `people` (profiles)
| column | type | notes |
|---|---|---|
| `id` | `uuid` pk | `gen_random_uuid()` |
| `account_id` | `uuid` not null → `accounts(id)` on delete cascade | |
| `kind` | `text` not null | `'adult' \| 'child'`; the F2 entity discriminator |
| `is_owner` | `boolean` not null default `false` | the profile tied to `owner_email` |
| `display_name` | `text` not null | |
| `avatar` | `text` not null | emoji / icon key |
| `pin_hash` | `text` null | null = no PIN on this profile |
| `birth_year` | `int` null | optional; drives age-appropriate / kid-safe mode |
| `created_at` | `timestamptz` default `now()` | |

= the future `Person` entity. Exactly one `is_owner = true` row per account
(created at signup, `kind='adult'`), enforced by a partial unique index.
Additional profiles (adult or child) can be added afterward.

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
- `create_account(p_email)` → creates the account + the owner adult `people`
  row (`is_owner=true`); returns ids. (Admin PIN is set later, lazily — see
  flow.)
- `set_admin_pin(p_account_id, p_pin)` → sets/updates `admin_pin_hash`.
- `create_profile(p_account_id, p_kind, p_name, p_avatar, p_pin)` → adds a
  profile (PIN optional; hashed in-RPC). Adding the first `kind='child'` profile
  requires `admin_pin_hash` to be set first (enforced in-RPC).
- `verify_profile_pin(p_person_id, p_pin)` → boolean.
- `verify_admin_pin(p_account_id, p_pin)` → boolean.
- `account_has_children(p_account_id)` → boolean (drives whether the admin zone
  must be locked).
- `list_profiles(p_account_id)` → profiles for the picker (no hashes).
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
   first successful login with no account for that email → `create_account`
   (creates the owner adult profile). No PIN is forced at signup for a solo
   adult.
2. **Entry decision:** the server calls `list_profiles`.
   - **One profile** (solo adult, the common case) → set `fh_active_profile` to
     that profile and redirect straight to `/app`. No picker, no PIN.
   - **More than one profile** → show the picker.
3. **Profile picker** (`/app/profiles`): server component calls `list_profiles`.
   Renders profile cards + "Add profile" + (when applicable) "Enter admin/family
   zone."
4. **Pick a profile:** a server action. If the profile has a `pin_hash`, prompt
   for the PIN and `verify_profile_pin` server-side; on success set the signed,
   httpOnly `fh_active_profile` cookie to the `person_id`. On failure, throttled
   retry.
5. **In-app** (`/app/*`): a server check reads `fh_active_profile`, resolves the
   person, and confirms the person's `account_id` matches the logged-in account.
   Missing/invalid cookie → redirect to picker (or auto-select for a
   single-profile account). The app shell and the activity logger use the active
   `person_id`. The `/api/activity` route independently re-derives `person_id`
   from the signed cookie and re-confirms account membership before calling
   `log_activity`, so a forged request cannot write activity for another
   account's profile. A child-kind active profile runs the app in kid-safe mode.
6. **Admin/guardian zone** (`/app/admin/*`): independent gate. When
   `account_has_children` is true, requires `verify_admin_pin` regardless of the
   active profile, so a child profile can never reach admin. For an adult-only
   account with no admin PIN set, the zone is reachable by the owner without a
   PIN (it is just account settings). A short-lived signed `fh_admin_unlock`
   cookie avoids re-prompting within a session.
7. **Switch profile / sign out:** "Switch profile" clears `fh_active_profile`
   and returns to the picker; sign out clears all cookies and the Auth.js
   session.

### Cookies
- `fh_active_profile` — httpOnly, secure, signed (HMAC with `AUTH_SECRET`),
  `SameSite=Lax`, session-scoped. Holds `person_id`.
- `fh_admin_unlock` — httpOnly, secure, signed, 30-minute TTL. Holds
  `account_id` + issued-at.

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
Copy shifts from kids-only framing to an **all-ages Christian community** voice
(individuals, families, communities), while preserving the warm tone and the
guardian/Gabriel motif for kid-safe mode. Keep the existing visual style/theme;
this is a name + framing change, not a redesign.

## Error handling

| Situation | Behavior |
|---|---|
| Wrong profile PIN | Friendly retry; after 5 failed attempts, lock that profile's PIN entry for 60s |
| Wrong admin PIN | Same; admin/guardian zone stays locked |
| Missing/invalid `fh_active_profile` | Redirect to picker (or auto-select for a single-profile account) |
| Active person not in the logged-in account | Clear cookie, redirect to picker |
| Adding a child profile with no admin PIN set | Block; require `set_admin_pin` first |
| Supabase not configured | App still boots; activity/strikes degrade gracefully (preserve current behavior) |
| Login but no account yet | Onboarding: `create_account` (owner adult profile); family/child profiles + admin PIN added on demand |

## Testing

- **RPC tests:** account/profile creation, owner-uniqueness, child-requires-admin-PIN
  rule, PIN verify (correct/incorrect), activity re-keying (`log_activity` →
  `my_activity` round-trip), strike add/clear/count.
- **Server-action / integration tests:** single-profile account skips the picker;
  multi-profile account shows it; profile pick sets the cookie only on correct
  PIN; admin zone blocked without `verify_admin_pin` when children exist; child
  profile cannot reach `/app/admin`; invalid active-profile cookie redirects.
- **Regression:** app boots with Supabase unconfigured; `npm run build`,
  `npm run typecheck`, and `npm run lint` all pass.

## Affected files (indicative)

- `auth.ts` — remove demo provider, drop dangerous linking, onboarding hook.
- `app/login/page.tsx` — remove demo block, rebrand/all-ages copy.
- `app/app/page.tsx`, `components/HavenApp.tsx` — use active `person_id`;
  kid-safe mode when active profile is `kind='child'`.
- `app/app/profiles/*` (new) — picker + PIN flow + server actions
  (auto-skip for single profile).
- `app/app/admin/*` (renamed from parents) — admin/guardian zone gate.
- `lib/supabase.ts`, `lib/activity.ts` — person-id keyed calls.
- `supabase/schema.sql` — new tables + RPCs.
- `middleware.ts`, `next.config.ts` — security headers, rate limiting.
- `.eslintrc*`, `package.json` — ESLint, rename.
- `README.md`, `app/layout.tsx` — rebrand.

## Forward-compatibility with later sub-projects

`people.kind` is the entity-type discriminator F2 generalizes; `accounts` is the
`Family`/account scope F3 formalizes; the `activity` table is the Raw-Layer
feedstock C4/C5 consume; `people.id` is the stable endpoint that S1's
`connected_to` / `favourites` relationships and DMs point at (including
cross-account person-to-person links). The all-ages model means S1's "adults
connect/DM freely, children parent-approved + moderated" rule keys directly off
`people.kind`. No F1 choice blocks the generic `entities`/`relationships` model
or the social graph.
