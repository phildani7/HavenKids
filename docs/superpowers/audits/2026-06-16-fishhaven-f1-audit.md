# FishHaven F1 — Comprehensive Audit (validated)

**Date:** 2026-06-16
**Branch:** `f1-identity-foundation` (PR #1)
**Method:** four independent fresh-eyes auditors (security, data/SQL, app-flow/spec, deploy/config), then every CRITICAL/HIGH finding **validated by re-reading the actual code**. Status tags: ✅ CONFIRMED · ⚖️ NUANCED/DOWNGRADED · ❎ false-positive.

> Bottom line: the cryptographic + data-isolation core is solid (HMAC cookies, service-role-only RPCs, pinned search_path, migration↔schema parity). The real risks are **authorization on independently-invocable Next.js server actions** — for a children's platform, several safety guarantees currently depend on the child not calling server actions directly, which is not a defensible boundary. Fix the CRITICAL block before onboarding real families.

---

## CRITICAL

### C1 — Under-gated, independently-invocable server actions (privilege escalation) ✅ CONFIRMED
Next.js `"use server"` actions are POST-invocable by **any authenticated session**, independent of the UI. Several F1 actions only check `requireAccount()` (any valid session), not the *active profile's kind* or admin-unlock state:

- **`addProfile`** — `app/app/profiles/actions.ts:44-52`. No admin gate; takes `kind` from client `formData`. A signed-in **child** can POST `kind=adult` (no PIN) and create an unrestricted adult profile, then `pickProfile` into it — escaping kid-safe mode and the PIN-locked admin gate. The DB `create_profile` only guards *child* creation (needs admin PIN); **adult creation has no guard at all.** Also orphaned (no UI references it).
- **`setupAdminPin`** — `app/app/admin/actions.ts:33-40`. Calls `setAdminPin` which **overwrites** unconditionally. No check that a PIN already exists and no active-kind gate. A child whose account already has an admin PIN can POST `setupAdminPin` to **reset the parent's admin PIN to a value they choose**, then `unlockAdmin` → full admin access.
- **`addChildProfile`** — `app/app/admin/actions.ts:42-49`. No `getAdminUnlock()` check; only `requireAccount()`. Any active session can add child profiles without passing the PIN gate.
- **`clearStrikesAction` / `recordStrikeAction`** — `app/app/strikes/actions.ts:15-25`. No admin/role gate. A child who hits 3 strikes (the event meant to pause the account for a guardian) can POST `clearStrikesAction` and wipe them.

**Fix:** Introduce one server-side guard used by every sensitive action: resolve the active profile and require `kind==='adult'` (or `is_owner`) AND, for admin operations, `getAdminUnlock() === accountId`. Never trust client `kind`. `setupAdminPin` must refuse when a PIN already exists (or require the current PIN). Clearing strikes must require admin unlock. Delete `addProfile` or gate it like `addChildProfile`.

### C2 — Moderation/strike detection is client-side only ✅ CONFIRMED
`components/screens/ChatPage.tsx` does the bad-word matching in the browser and only then calls `bumpStrike → recordStrikeAction`. A child can bypass it entirely (never self-report). Combined with C1's clearable strikes, the strike system provides **no real enforcement against the user it targets.** (Noted as a mock since the original 2026-06-10 audit; F1 persisted the *count* but not the *enforcement*.)
**Fix:** strike detection must run server-side (or in a trusted path); strikes must not be self-clearable by the monitored profile.

---

## HIGH

### H1 — `next_auth` adapter grants run before the tables exist ✅ CONFIRMED
`supabase/migrations/20260614000000_f1_identity.sql:211-213` (and `schema.sql`): `grant all on all tables in schema next_auth to service_role` executes at line 211, but the `next_auth.*` tables are created at lines 215-253. `GRANT … ON ALL TABLES` only affects tables that exist *at execution time*, so on a **first clean deploy** `service_role` gets no privileges on the adapter tables → **email magic-link login (verification tokens) is broken.** Masked on re-runs (tables exist by then).
**Fix:** create the four `next_auth.*` tables *before* the `grant all on all …` statements (keep `grant usage on schema` first).

### H2 — Sidebar still shows "Haven / Kids" (brand regression) ✅ CONFIRMED
`components/shell.tsx:54` renders `Haven` and `:64` renders `Kids` as two separate user-visible logo elements. The Task-20 rebrand grep for `"Haven Kids"` missed it because the words are on separate lines. Every in-app screen shows the old brand.
**Fix:** update the sidebar logo to "FishHaven".

### H3 — `lib/supabase.ts` is not `server-only` ✅ CONFIRMED
`lib/supabase.ts:1` lacks `import "server-only"` (only `lib/accounts.ts` has it). `getSupabaseAdmin()` reads `SUPABASE_SERVICE_ROLE_KEY`. Today only server files import it, but nothing fails the build if a client component imports it — a fragile guard around the most sensitive secret.
**Fix:** add `import "server-only";` at the top of `lib/supabase.ts`.

### H4 — `tsconfig.tsbuildinfo` is committed to git ✅ CONFIRMED
Tracked since the initial commit; `tsconfig.json` has `incremental: true`. It embeds absolute local paths and causes cross-machine cache issues.
**Fix:** add to `.gitignore` and `git rm --cached tsconfig.tsbuildinfo`.

### H5 — Low PIN assurance (keyspace + throttle) ✅ CONFIRMED
- Profile/child PINs have no length/format policy (`profiles/actions.ts:49`, `admin/actions.ts:46`): a 1-char PIN is accepted; empty-after-trim silently becomes no-PIN. Admin PIN enforces only `>=4` (`admin/actions.ts:36`).
- The throttle (`lib/rate-limit.ts`) is an in-memory module Map → **per-instance**; on serverless/multi-instance the lockout doesn't aggregate and evaporates on scale/redeploy. PIN lock keys also lack the IP component the spec called for.
**Fix:** enforce a min PIN length/format for all PINs; back the throttle with a durable store (Upstash/Redis) before enabling PIN-protected children in production.

### H6 — Unhandled RPC throws at entry routing → 500 instead of graceful degrade ✅ CONFIRMED
`app/app/page.tsx:13` (and `requireAccount` in the action files) call `accountIdForEmail → ensureAccount → create_account` which throws on RPC failure. The `signIn` callback swallows this, but the page/actions don't → unhandled 500. Spec calls for graceful Supabase-down degradation.
**Fix:** wrap entry-routing account resolution in try/catch and degrade (or show a friendly error).

---

## MEDIUM

- **M1 — Solo adult forced to set an admin PIN to view settings.** ⚖️ DOWNGRADED (app auditor rated Critical). `app/app/admin/page.tsx:25` ignores `account_has_children`, so an adult-only, no-PIN owner sees "Set a PIN" instead of reaching settings. Spec: adult-only no-PIN accounts reach admin without a PIN. **Over-locking — safe but a spec/UX deviation, not a security hole.** Fix: `if (!unlocked && (pinSet || hasChildren)) return <AdminGate…>` else allow in.
- **M2 — `seed.sql` missing but referenced.** `supabase/config.toml:71` `sql_paths = ["./seed.sql"]`; file absent → `supabase db reset` errors. Fix: create empty `seed.sql`, drop the path, or `enabled=false`.
- **M3 — `ensureAccount` writes on every request.** `lib/accounts.ts:19-22` aliases `accountIdForEmail`→`ensureAccount` (an upsert), run on every page load and `/api/activity` call. Idempotent but an unnecessary write per request (DoS amplification). Fix: add a read-only `account_id_for_email` RPC for the hot path; reserve `create_account` for the sign-in callback.
- **M4 — `birth_year` dead column.** `people.birth_year` is never written, returned, or read. Implement (age signal for kid-mode) or drop.
- **M5 — Empty admin PIN counts as a failed attempt.** `admin/actions.ts:20` lacks the empty-PIN early-out the profile flow has (`profiles/actions.ts:30`) → accidental self-lockout.
- **M6 — RPCs trust `p_person_id` with no account join.** Functions like `log_activity`/`add_strike`/`clear_strikes` don't verify the person belongs to the account. No live IDOR (every caller pre-checks via `resolveActiveProfile`), but a latent footgun. Fix: have the RPCs take `(account_id, person_id)` and verify the join in-DB.
- **M7 — README + .env.example stale.** README activity description still says "scoped by email"; project layout omits all F1 files (`auth.config.ts`, `app/app/profiles`, `app/app/admin`, `app/app/strikes`, `lib/accounts.ts`, `lib/session.ts`, `lib/rate-limit.ts`, `supabase/migrations/`); deploy story mentions only `schema.sql` (no hosted-migration step). `.env.example` doesn't mark `AUTH_SECRET`/`SUPABASE_SERVICE_ROLE_KEY` as **required** (service-role is now required, not optional) and still references `haven-kids.vercel.app`.

---

## LOW / COSMETIC

- **L1 — Kid-safe mode is cosmetic.** `components/HavenApp.tsx:73` sets `document.documentElement.dataset.kidSafe` but **nothing reads it** (validated: no `[data-kid-safe]` selector, no conditional). The sidebar even shows "For Parents" to a child profile. Honest status: foundation-only; F1 doesn't enforce any kid-safe behavior yet.
- **L2 — Dead code.** `components/screens/ParentsPage.tsx` no longer imported (route renders an inline stub); `RoutePage` still includes `"parents"`. Delete the file / note the vestigial type.
- **L3 — Migration `ALTER … SET NOT NULL` unguarded.** `migration:136` will abort if `activity.person_id` NULLs exist. Add `delete from public.activity where person_id is null;` before it.
- **L4 — pgTAP coverage gaps.** Missing assertions: child-without-admin-PIN throws; adult-profile creation; wrong-profile-PIN rejection; `list_profiles` no-hash-leak column check. (Current `plan(24)` matches its 24 assertions — validated.)
- **L5 — CSP `script-src 'unsafe-inline'`.** `next.config.ts:14` — defeats CSP XSS protection; acceptable now (no user-generated HTML), but the roadmap is user chat for minors → move to nonce-based CSP before that lands.
- **L6 — Auth route lacks explicit `runtime`.** `app/api/auth/[...nextauth]/route.ts` has no `export const runtime = "nodejs"`; defaults to node in Next 15 (currently safe) but should be explicit like `/api/activity`.
- **L7 — Empty-providers login is a silent dead-end.** With no Google/Resend env, the login page shows descriptive text but no controls and no error. Add an explicit empty-state.
- **L8 — Cosmetic branding leftovers.** `supabase/config.toml:6` `project_id="HavenKids"`; all-caps `HAVEN KIDS` file-header comments; `trustHost: true` unconditional (host-header trust if ever behind an untrusted proxy).

---

## Confirmed FIXED (validated this audit)
- RPC `EXECUTE` revoked from `anon`/`public`, granted only to `service_role` (migration).
- Child profile blocked from `/app/admin` (`admin/page.tsx:20`) + admin re-locks on every profile switch (`profiles/actions.ts:39`, `profiles/page.tsx:25`).
- `create_account` `people.account_id` qualification (was a first-login crash).
- `search_path = public, extensions` on all 13 RPCs (pgcrypto in `extensions` on Supabase) — verified passing on real Supabase Postgres.
- Demo Credentials provider and `allowDangerousEmailAccountLinking` removed.
- Migration ↔ `schema.sql` parity (identical but for comments); pgTAP `plan(24)` == 24 assertions.

---

## Recommended fix order before merge / launch
1. **C1 + C2** (server-action authorization + server-side strike enforcement) — the only true blockers for a kids platform.
2. **H1** (next_auth grant ordering — breaks email login on first deploy), **H2** (sidebar brand), **H3** (`server-only`), **H4** (tsbuildinfo).
3. **H5/H6** before production scale; **M1–M7** as cleanup; **L*** opportunistically.

## Resolution — all findings fixed (2026-06-16)

Every finding above was fixed on `f1-identity-foundation` and verified (typecheck/lint/7 unit tests/build green; DB changes verified on real Supabase Postgres in rolled-back transactions; C1/C2 re-reviewed by an independent Opus security pass — no remaining authorization holes).

| Finding | Fix | Commit |
|---|---|---|
| **C1** server-action authorization | New `lib/guards.ts` (`requireActiveAdult` / `requireAdminUnlock`); `addProfile` deleted; `setupAdminPin` overwrite-proof; `addChildProfile` + `clearChildStrikes` require active-adult + admin-unlock; `clearChildStrikes` verifies account ownership | `f6e50a6` |
| **C2** client-side moderation | `moderateMessage` server action: blocklist + strike recording server-side from the session-derived profile; `bumpStrike` UI-only; `strikes/actions.ts` deleted | `61eb47b` |
| **H1** next_auth grant ordering | tables created before `grant on all` (verified: service_role gets next_auth privileges) | `4d5ce32` |
| **H2** sidebar "Haven/Kids" | sidebar wordmark → FishHaven | `ce9960a` |
| **H3** supabase.ts not server-only | `import "server-only"` added | `ce9960a` |
| **H4** tsbuildinfo committed | gitignored + `git rm --cached` | `ce9960a` |
| **H5** PIN keyspace/throttle | PIN min 4 digits numeric (`/^\d{4,}$/`) enforced; durable-store throttle documented as the remaining production step | `f6e50a6` |
| **H6** unhandled RPC throws | entry routing wraps account resolution in try/catch → `/login?error=service` | `ce9960a` |
| **M1** solo-adult over-lock | admin gate `!unlocked && (pinSet || hasChildren)` | `f6e50a6` |
| **M2** missing seed.sql | `supabase/seed.sql` created | `ce9960a` |
| **M3** write on every request | read-only `account_id_for_email` RPC; write only on first-login fallback | `4d5ce32` / `f6e50a6` |
| **M4** birth_year dead column | dropped | `4d5ce32` |
| **M5** empty admin PIN burns attempt | empty-PIN early-out in `unlockAdmin` | `f6e50a6` |
| **M7** stale README/.env | README + `.env.example` updated (accounts/profiles/admin, service-role required, server-side moderation, migrations) | `ed89c73` |
| **L1** kid-safe cosmetic | child profiles no longer see the admin/parents nav (real kid-safe behavior) | `ce9960a` |
| **L2** ParentsPage dead code | deleted | `ce9960a` |
| **L3** SET NOT NULL unguarded | `delete ... where person_id is null` before the alter | `4d5ce32` |
| **L4** pgTAP coverage | +4 assertions (child-without-PIN, wrong-PIN, has_pin no-leak, adult-create) → `plan(28)` | `4d5ce32` |
| **L6** auth route runtime | `export const runtime = "nodejs"` | `ce9960a` |
| **L7** empty-providers login | explicit "no sign-in method configured" notice | `ce9960a` |
| **L8** cosmetic branding | `config.toml` project_id + file-header comments → FishHaven | `ce9960a` |

**M6** (account-scoping the activity/strike RPC *signatures*) was **deliberately deferred**: the audit confirmed no live IDOR (every caller pre-checks via `resolveActiveProfile`), and a hot-path RPC signature refactor carries more regression risk than the latent issue. Tracked for a future hardening pass.

**Accepted residual (documented, needs a later sub-project):** chat *message delivery* is still client-side demo state, so a fully tampered client could avoid calling `moderateMessage`; the strike *record* is now server-authoritative, which closes C2 as scoped for F1. Durable (Redis) rate-limiting and nonce-based CSP remain pre-production hardening items.

## ENV VARS REQUIRED TO RUN F1
| Var | Required | Where | Public/Secret |
|---|---|---|---|
| `AUTH_SECRET` | **Yes** (cookie HMAC; app throws without it) | `lib/session.ts` | Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `lib/supabase.ts`, `auth.ts` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | `lib/supabase.ts` | Public (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** (all F1 RPCs are service-role-only now) | `lib/supabase.ts`, adapter | Secret |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | One provider required | `auth.config.ts` | ID semi-public / secret |
| `AUTH_RESEND_KEY` | One provider required | `auth.config.ts` | Secret |
| `AUTH_EMAIL_FROM` | Optional | `auth.config.ts` | Public |
| `NEXTAUTH_URL` | Non-Vercel hosts only | next-auth | Public |
