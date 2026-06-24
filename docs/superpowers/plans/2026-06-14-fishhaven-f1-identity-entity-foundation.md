# FishHaven F1 — Identity & Entity Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the always-on demo login with a real account → multi-profile identity system (adults + children, optional PINs, admin/guardian zone), persist activity & strikes in Supabase, harden auth, and rebrand Haven Kids → FishHaven.

**Architecture:** One Auth.js login owns an `accounts` row that owns 1..N `people` (profiles, `kind = adult|child`). After login the server resolves profiles: a single-profile account goes straight in; otherwise a Netflix-style picker sets a signed, httpOnly `fh_active_profile` cookie. PIN-protected profiles and the admin zone are verified server-side via `SECURITY DEFINER` Postgres RPCs. The Next.js server is the trust boundary; the browser never calls Supabase directly.

**Tech Stack:** Next.js 15 (App Router, server actions), Auth.js v5, Supabase (Postgres + RPCs), `@supabase/supabase-js`, Node `crypto` for cookie signing, Vitest (TS tests), Supabase CLI + pgTAP (SQL tests), ESLint.

**Spec:** `docs/superpowers/specs/2026-06-14-fishhaven-f1-identity-entity-foundation-design.md`

**Conventions for this plan:**
- All commands run from the repo root `~/CC/FishHaven/HavenKids`.
- PIN hashing uses pgcrypto **bcrypt** (`crypt(pin, gen_salt('bf'))`) — the spec said "scrypt", but stock pgcrypto ships bcrypt, not scrypt; bcrypt is the correct in-DB choice. This is the one intentional deviation.
- "Run X / Expected: Y" steps mean: run the command and confirm the output matches before checking the box.

---

## File structure

**Create:**
- `.eslintrc.json` — ESLint config so `npm run lint` works.
- `vitest.config.ts` — Vitest config (node env).
- `lib/session.ts` — signed-cookie helpers (active profile + admin unlock).
- `lib/session.test.ts` — Vitest unit tests for the above.
- `lib/rate-limit.ts` — in-memory fixed-window limiter + PIN-attempt throttle.
- `lib/rate-limit.test.ts` — Vitest unit tests.
- `lib/accounts.ts` — server-side wrappers over the identity RPCs.
- `app/app/profiles/page.tsx` — profile picker.
- `app/app/profiles/actions.ts` — server actions (pick / add / switch).
- `app/app/profiles/PickerClient.tsx` — client UI for the picker + PIN entry.
- `app/app/admin/page.tsx` — admin/guardian zone (hosts the existing ParentsPage).
- `app/app/admin/actions.ts` — `verify_admin_pin` + unlock cookie.
- `app/app/admin/AdminGate.tsx` — client PIN gate.
- `supabase/migrations/20260614000000_f1_identity.sql` — schema + RPCs (CLI source of truth).
- `supabase/tests/f1_identity.test.sql` — pgTAP SQL tests.

**Modify:**
- `auth.ts` — remove demo provider, drop `allowDangerousEmailAccountLinking`, add account-onboarding.
- `app/login/page.tsx` — remove demo block, all-ages copy.
- `app/app/page.tsx` — entry routing using the active profile.
- `components/HavenApp.tsx` — use active person, real strikes, kid-safe mode.
- `lib/activity.ts` — person-id keyed logging.
- `app/api/activity/route.ts` — re-derive person_id from cookie + membership check + rate limit.
- `lib/supabase.ts` — (rebrand header only).
- `supabase/schema.sql` — keep the single-file "run once" path in sync with the migration.
- `next.config.ts` — security headers, enable ESLint in builds.
- `app/layout.tsx`, `README.md`, `package.json` — rebrand.
- `package.json` — add scripts/devDeps for vitest + eslint.

---

## Phase A — Tooling

### Task 1: ESLint config so `npm run lint` works

**Files:**
- Create: `.eslintrc.json`
- Modify: `package.json` (devDependencies), `next.config.ts`

- [ ] **Step 1: Install ESLint deps**

Run:
```bash
npm install -D eslint@^9 eslint-config-next@^15
```
Expected: packages added, no errors.

- [ ] **Step 2: Create `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 3: Stop ignoring ESLint during builds**

In `next.config.ts`, change:
```ts
  eslint: {
    ignoreDuringBuilds: true,
  },
```
to:
```ts
  eslint: {
    ignoreDuringBuilds: false,
  },
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: completes (warnings OK, no crash about missing config). Fix any errors it reports in files you will touch later; pre-existing warnings elsewhere may stay for now.

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.json next.config.ts package.json package-lock.json
git commit -m "chore: add ESLint config so lint script runs"
```

### Task 2: Vitest test harness

**Files:**
- Create: `vitest.config.ts`, `lib/smoke.test.ts` (temporary)
- Modify: `package.json` (scripts + devDeps)

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest@^2
```
Expected: installed.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next", "supabase/**"],
  },
});
```

- [ ] **Step 3: Add the `test` script to `package.json`**

In the `"scripts"` block add:
```json
    "test": "vitest run",
```

- [ ] **Step 4: Write a smoke test**

`lib/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm lib/smoke.test.ts
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test harness"
```

### Task 3: Supabase CLI + pgTAP harness

**Files:** none yet (sets up local DB testing used by Phase B).

- [ ] **Step 1: Install the Supabase CLI**

Run: `npx supabase --version`
Expected: prints a version (downloads on first run). If it fails, install per https://supabase.com/docs/guides/cli (e.g. `brew install supabase/tap/supabase`).

- [ ] **Step 2: Initialize Supabase locally (if not already)**

Run: `npx supabase init`
Expected: creates `supabase/config.toml` (keep it). If it says already initialized, fine.

- [ ] **Step 3: Start the local stack**

Run: `npx supabase start`
Expected: prints local API URL + anon/service keys. Docker must be running. This is the DB the pgTAP tests run against.

- [ ] **Step 4: Enable pgTAP + create the tests dir**

Run:
```bash
mkdir -p supabase/tests
npx supabase db reset
```
Expected: reset completes (no migrations yet, so empty). pgTAP is bundled with the Supabase local image.

- [ ] **Step 5: Commit the supabase scaffolding**

```bash
git add supabase/config.toml
git commit -m "chore: init supabase local stack for SQL tests"
```

---

## Phase B — Database schema & RPCs (pgTAP TDD)

> Each task writes pgTAP assertions first, runs them to see them fail, then adds SQL to the migration to make them pass. Run SQL tests with:
> `npx supabase db reset && npx supabase test db`
> (`db reset` re-applies migrations into a clean DB; `test db` runs `supabase/tests/*.test.sql`.)

### Task 4: `accounts` and `people` tables

**Files:**
- Create: `supabase/migrations/20260614000000_f1_identity.sql`
- Create: `supabase/tests/f1_identity.test.sql`

- [ ] **Step 1: Write failing pgTAP tests for the tables**

`supabase/tests/f1_identity.test.sql`:
```sql
begin;
select plan(6);

-- tables exist
select has_table('public', 'accounts', 'accounts table exists');
select has_table('public', 'people', 'people table exists');

-- an account can be created
insert into public.accounts (owner_email) values ('a@example.com');
select is(
  (select count(*)::int from public.accounts where owner_email = 'a@example.com'),
  1, 'account inserted');

-- owner profile uniqueness: two is_owner=true under one account fails
insert into public.people (account_id, kind, is_owner, display_name, avatar)
  select id, 'adult', true, 'Owner', '🙂' from public.accounts where owner_email='a@example.com';
select throws_ok(
  $$ insert into public.people (account_id, kind, is_owner, display_name, avatar)
       select id, 'adult', true, 'Owner2', '🙂' from public.accounts where owner_email='a@example.com' $$,
  null, null, 'second owner profile rejected');

-- a non-owner second profile is allowed
select lives_ok(
  $$ insert into public.people (account_id, kind, is_owner, display_name, avatar)
       select id, 'child', false, 'Kiddo', '🦄' from public.accounts where owner_email='a@example.com' $$,
  'non-owner profile allowed');

-- kind is constrained
select throws_ok(
  $$ insert into public.people (account_id, kind, is_owner, display_name, avatar)
       select id, 'robot', false, 'Bad', '🤖' from public.accounts where owner_email='a@example.com' $$,
  null, null, 'invalid kind rejected');

select * from finish();
rollback;
```

- [ ] **Step 2: Create the migration with extensions + tables**

`supabase/migrations/20260614000000_f1_identity.sql`:
```sql
-- FishHaven F1 — Identity & Entity Foundation
create extension if not exists pgcrypto;

-- accounts: one per Auth.js login
create table if not exists public.accounts (
  id             uuid primary key default gen_random_uuid(),
  owner_email    text unique not null,
  admin_pin_hash text,
  created_at     timestamptz not null default now()
);

-- people: profiles under an account
create table if not exists public.people (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts(id) on delete cascade,
  kind         text not null check (kind in ('adult','child')),
  is_owner     boolean not null default false,
  display_name text not null,
  avatar       text not null,
  pin_hash     text,
  birth_year   int,
  created_at   timestamptz not null default now()
);

-- exactly one owner profile per account
create unique index if not exists people_one_owner_per_account
  on public.people (account_id) where is_owner;

create index if not exists people_account_idx on public.people (account_id);

alter table public.accounts enable row level security;
alter table public.people   enable row level security;
-- No anon policies: all access is via SECURITY DEFINER RPCs from the trusted server.
```

- [ ] **Step 3: Run tests — expect the table tests to pass (6/6)**

Run: `npx supabase db reset && npx supabase test db`
Expected: `f1_identity.test.sql .. ok` with 6 passing. (If `db reset` fails, ensure `supabase start` ran in Task 3.)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260614000000_f1_identity.sql supabase/tests/f1_identity.test.sql
git commit -m "feat(db): accounts + people tables with owner uniqueness"
```

### Task 5: Identity RPCs

**Files:**
- Modify: `supabase/migrations/20260614000000_f1_identity.sql` (append)
- Modify: `supabase/tests/f1_identity.test.sql` (extend)

- [ ] **Step 1: Add failing pgTAP tests for the RPCs**

Append inside the transaction in `supabase/tests/f1_identity.test.sql` (raise the `plan(6)` count to `plan(16)` and add before `finish()`):
```sql
-- create_account makes account + owner profile
select lives_ok(
  $$ select public.create_account('owner@example.com') $$,
  'create_account runs');
select is(
  (select count(*)::int from public.people p
     join public.accounts a on a.id = p.account_id
    where a.owner_email='owner@example.com' and p.is_owner),
  1, 'create_account created one owner profile');

-- helper to grab the account id
-- set admin pin then verify
select lives_ok(
  $$ select public.set_admin_pin(
       (select id from public.accounts where owner_email='owner@example.com'), '1234') $$,
  'set_admin_pin runs');
select ok(
  public.verify_admin_pin((select id from public.accounts where owner_email='owner@example.com'), '1234'),
  'correct admin pin verifies');
select ok(
  not public.verify_admin_pin((select id from public.accounts where owner_email='owner@example.com'), '9999'),
  'wrong admin pin rejected');
select ok(
  public.admin_pin_is_set((select id from public.accounts where owner_email='owner@example.com')),
  'admin_pin_is_set true after set');

-- create a child profile (allowed because admin pin is set)
select lives_ok(
  $$ select public.create_profile(
       (select id from public.accounts where owner_email='owner@example.com'),
       'child', 'Sam', '🦊', '4321') $$,
  'create_profile child runs');

-- account_has_children true now
select ok(
  public.account_has_children((select id from public.accounts where owner_email='owner@example.com')),
  'account_has_children true');

-- verify child profile pin
select ok(
  public.verify_profile_pin(
    (select id from public.people where display_name='Sam'), '4321'),
  'correct profile pin verifies');

-- list_profiles returns rows without hashes
select is(
  (select count(*)::int from public.list_profiles(
     (select id from public.accounts where owner_email='owner@example.com'))),
  2, 'list_profiles returns owner + child');
```

- [ ] **Step 2: Run tests — expect failures (functions do not exist yet)**

Run: `npx supabase db reset && npx supabase test db`
Expected: failures referencing missing functions `create_account` etc.

- [ ] **Step 3: Append the RPCs to the migration**

Add to `supabase/migrations/20260614000000_f1_identity.sql`:
```sql
-- ---- Identity RPCs (SECURITY DEFINER) ----

create or replace function public.create_account(p_email text)
returns table(account_id uuid, owner_person_id uuid)
language plpgsql security definer set search_path = public as $$
declare a_id uuid; p_id uuid;
begin
  insert into public.accounts (owner_email) values (p_email)
  on conflict (owner_email) do update set owner_email = excluded.owner_email
  returning id into a_id;

  select id into p_id from public.people where account_id = a_id and is_owner;
  if p_id is null then
    insert into public.people (account_id, kind, is_owner, display_name, avatar)
    values (a_id, 'adult', true, split_part(p_email,'@',1), '🙂')
    returning id into p_id;
  end if;

  account_id := a_id; owner_person_id := p_id; return next;
end $$;

create or replace function public.set_admin_pin(p_account_id uuid, p_pin text)
returns void language sql security definer set search_path = public as $$
  update public.accounts set admin_pin_hash = crypt(p_pin, gen_salt('bf'))
  where id = p_account_id;
$$;

create or replace function public.verify_admin_pin(p_account_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select admin_pin_hash = crypt(p_pin, admin_pin_hash)
       from public.accounts where id = p_account_id and admin_pin_hash is not null),
    false);
$$;

create or replace function public.account_has_children(p_account_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.people where account_id = p_account_id and kind = 'child');
$$;

create or replace function public.admin_pin_is_set(p_account_id uuid)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select admin_pin_hash is not null
                     from public.accounts where id = p_account_id), false);
$$;

create or replace function public.create_profile(
  p_account_id uuid, p_kind text, p_name text, p_avatar text, p_pin text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if p_kind not in ('adult','child') then
    raise exception 'invalid kind %', p_kind;
  end if;
  -- adding a child requires an admin pin to exist (so the admin zone can be locked)
  if p_kind = 'child'
     and (select admin_pin_hash from public.accounts where id = p_account_id) is null then
    raise exception 'admin pin must be set before adding a child profile';
  end if;
  insert into public.people (account_id, kind, is_owner, display_name, avatar, pin_hash)
  values (p_account_id, p_kind, false, p_name, p_avatar,
          case when p_pin is null then null else crypt(p_pin, gen_salt('bf')) end)
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.verify_profile_pin(p_person_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce(
    (select pin_hash = crypt(p_pin, pin_hash)
       from public.people where id = p_person_id and pin_hash is not null),
    false);
$$;

create or replace function public.list_profiles(p_account_id uuid)
returns table(id uuid, kind text, is_owner boolean, display_name text,
              avatar text, has_pin boolean)
language sql security definer set search_path = public as $$
  select id, kind, is_owner, display_name, avatar, (pin_hash is not null)
  from public.people where account_id = p_account_id
  order by is_owner desc, created_at asc;
$$;
```

- [ ] **Step 4: Run tests — expect all passing (16/16)**

Run: `npx supabase db reset && npx supabase test db`
Expected: 16 passing.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260614000000_f1_identity.sql supabase/tests/f1_identity.test.sql
git commit -m "feat(db): identity RPCs (account/profile/pin management)"
```

### Task 6: Re-key `activity` to `person_id` + activity RPCs

**Files:**
- Modify: `supabase/migrations/20260614000000_f1_identity.sql` (append)
- Modify: `supabase/tests/f1_identity.test.sql` (extend)

- [ ] **Step 1: Add failing pgTAP tests**

Raise `plan()` to `plan(19)` and append before `finish()`:
```sql
select has_table('public', 'activity', 'activity table exists');
select lives_ok(
  $$ select public.log_activity(
       (select id from public.people where display_name='Sam'),
       'view_page', '{"page":"home"}'::jsonb, 'test-agent') $$,
  'log_activity runs');
select is(
  (select count(*)::int from public.my_activity(
     (select id from public.people where display_name='Sam'), 50)),
  1, 'my_activity returns the logged row');
```

- [ ] **Step 2: Run tests — expect failures (activity not person-keyed; RPCs missing)**

Run: `npx supabase db reset && npx supabase test db`
Expected: failures on `log_activity` / `my_activity`.

- [ ] **Step 3: Append the activity migration**

```sql
-- ---- Activity (re-keyed from email to person_id) ----
create table if not exists public.activity (
  id          bigserial primary key,
  person_id   uuid,
  event       text not null,
  data        jsonb not null default '{}'::jsonb,
  user_agent  text,
  created_at  timestamptz not null default now()
);

-- migrate any legacy email-keyed table to person_id (no prod data expected)
alter table public.activity drop column if exists email;
alter table public.activity add column if not exists person_id uuid;
alter table public.activity
  drop constraint if exists activity_person_id_fkey;
alter table public.activity
  add constraint activity_person_id_fkey
  foreign key (person_id) references public.people(id) on delete cascade;
alter table public.activity alter column person_id set not null;

drop index if exists public.activity_email_created_idx;
create index if not exists activity_person_created_idx
  on public.activity (person_id, created_at desc);
create index if not exists activity_event_created_idx
  on public.activity (event, created_at desc);

alter table public.activity enable row level security;
drop policy if exists "activity_self_select" on public.activity;
drop policy if exists "activity_block_direct_write" on public.activity;
-- access only via RPCs below

create or replace function public.log_activity(
  p_person_id uuid, p_event text, p_data jsonb, p_user_agent text)
returns void language sql security definer set search_path = public as $$
  insert into public.activity (person_id, event, data, user_agent)
  values (p_person_id, p_event, coalesce(p_data,'{}'::jsonb), p_user_agent);
$$;

create or replace function public.my_activity(p_person_id uuid, p_limit int)
returns table(event text, data jsonb, created_at timestamptz)
language sql security definer set search_path = public as $$
  select event, data, created_at from public.activity
  where person_id = p_person_id
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit,50), 200));
$$;
```

- [ ] **Step 4: Run tests — expect all passing (19/19)**

Run: `npx supabase db reset && npx supabase test db`
Expected: 19 passing.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260614000000_f1_identity.sql supabase/tests/f1_identity.test.sql
git commit -m "feat(db): re-key activity to person_id; add log_activity/my_activity RPCs"
```

### Task 7: `strikes` table + RPCs

**Files:**
- Modify: `supabase/migrations/20260614000000_f1_identity.sql` (append)
- Modify: `supabase/tests/f1_identity.test.sql` (extend)

- [ ] **Step 1: Add failing pgTAP tests**

Raise `plan()` to `plan(24)` and append before `finish()`:
```sql
select has_table('public', 'strikes', 'strikes table exists');
select lives_ok(
  $$ select public.add_strike((select id from public.people where display_name='Sam'), 'unkind words') $$,
  'add_strike runs');
select is(
  public.active_strikes((select id from public.people where display_name='Sam')),
  1, 'active_strikes counts the strike');
select lives_ok(
  $$ select public.clear_strikes((select id from public.people where display_name='Sam')) $$,
  'clear_strikes runs');
select is(
  public.active_strikes((select id from public.people where display_name='Sam')),
  0, 'clear_strikes resets count');
```

- [ ] **Step 2: Run tests — expect failures (strikes missing)**

Run: `npx supabase db reset && npx supabase test db`
Expected: failures on strikes.

- [ ] **Step 3: Append the strikes migration**

```sql
-- ---- Strikes (moderation, persisted) ----
create table if not exists public.strikes (
  id         bigserial primary key,
  person_id  uuid not null references public.people(id) on delete cascade,
  reason     text not null,
  created_at timestamptz not null default now(),
  cleared_at timestamptz
);
create index if not exists strikes_person_active_idx
  on public.strikes (person_id) where cleared_at is null;
alter table public.strikes enable row level security;

create or replace function public.add_strike(p_person_id uuid, p_reason text)
returns void language sql security definer set search_path = public as $$
  insert into public.strikes (person_id, reason) values (p_person_id, p_reason);
$$;

create or replace function public.clear_strikes(p_person_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.strikes set cleared_at = now()
  where person_id = p_person_id and cleared_at is null;
$$;

create or replace function public.active_strikes(p_person_id uuid)
returns int language sql security definer set search_path = public as $$
  select count(*)::int from public.strikes
  where person_id = p_person_id and cleared_at is null;
$$;
```

- [ ] **Step 4: Run tests — expect all passing (24/24)**

Run: `npx supabase db reset && npx supabase test db`
Expected: 24 passing.

- [ ] **Step 5: Sync `supabase/schema.sql` to final state**

Replace the body of `supabase/schema.sql` with a header comment pointing at the migration as the source of truth, and paste the full final contents of `supabase/migrations/20260614000000_f1_identity.sql` beneath it (so the "run once in SQL editor" path still works). Keep the existing `next_auth.*` adapter-table section from the old `schema.sql` at the end (Auth.js still needs it if the adapter is enabled).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260614000000_f1_identity.sql supabase/tests/f1_identity.test.sql supabase/schema.sql
git commit -m "feat(db): persisted strikes + RPCs; sync schema.sql"
```

---

## Phase C — Session & security libraries (Vitest TDD)

### Task 8: Signed-cookie session helpers

**Files:**
- Create: `lib/session.ts`, `lib/session.test.ts`

- [ ] **Step 1: Write failing tests**

`lib/session.test.ts`:
```ts
import { describe, it, expect, beforeAll } from "vitest";
import { signValue, verifySigned, signWithTs, verifyWithTs } from "./session";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-please-change";
});

describe("signValue / verifySigned", () => {
  it("round-trips a value", () => {
    const s = signValue("abc-123");
    expect(verifySigned(s)).toBe("abc-123");
  });
  it("rejects a tampered value", () => {
    const s = signValue("abc-123");
    const tampered = "xyz" + s.slice(3);
    expect(verifySigned(tampered)).toBeNull();
  });
  it("rejects garbage", () => {
    expect(verifySigned("not-a-cookie")).toBeNull();
  });
});

describe("signWithTs / verifyWithTs (TTL)", () => {
  it("accepts a fresh value within ttl", () => {
    const s = signWithTs("acct-1");
    expect(verifyWithTs(s, 60_000)).toBe("acct-1");
  });
  it("rejects an expired value", () => {
    const past = Date.now() - 120_000;
    const s = signWithTs("acct-1", past);
    expect(verifyWithTs(s, 60_000)).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect fail (module missing)**

Run: `npm test -- lib/session.test.ts`
Expected: FAIL (cannot find `./session`).

- [ ] **Step 3: Implement `lib/session.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ACTIVE_PROFILE_COOKIE = "fh_active_profile";
const ADMIN_UNLOCK_COOKIE = "fh_admin_unlock";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function hmac(input: string): string {
  return createHmac("sha256", secret()).update(input).digest("base64url");
}

/** Sign a plain value as `<b64url(value)>.<sig>`. */
export function signValue(value: string): string {
  const v = Buffer.from(value, "utf8").toString("base64url");
  return `${v}.${hmac(v)}`;
}

export function verifySigned(signed: string | undefined | null): string | null {
  if (!signed || !signed.includes(".")) return null;
  const [v, sig] = signed.split(".");
  if (!v || !sig) return null;
  const expected = hmac(v);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(v, "base64url").toString("utf8");
}

/** Sign a value with an embedded timestamp for TTL checks. */
export function signWithTs(value: string, ts: number = Date.now()): string {
  return signValue(`${ts}:${value}`);
}

export function verifyWithTs(signed: string | undefined | null, ttlMs: number): string | null {
  const raw = verifySigned(signed);
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx < 0) return null;
  const ts = Number(raw.slice(0, idx));
  const value = raw.slice(idx + 1);
  if (!Number.isFinite(ts) || Date.now() - ts > ttlMs) return null;
  return value;
}

// ---- cookie accessors (server-only) ----

export async function setActiveProfile(personId: string) {
  (await cookies()).set(ACTIVE_PROFILE_COOKIE, signValue(personId), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/",
  });
}

export async function getActiveProfile(): Promise<string | null> {
  return verifySigned((await cookies()).get(ACTIVE_PROFILE_COOKIE)?.value);
}

export async function clearActiveProfile() {
  (await cookies()).delete(ACTIVE_PROFILE_COOKIE);
}

const ADMIN_TTL_MS = 30 * 60 * 1000;

export async function setAdminUnlock(accountId: string) {
  (await cookies()).set(ADMIN_UNLOCK_COOKIE, signWithTs(accountId), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: ADMIN_TTL_MS / 1000,
  });
}

export async function getAdminUnlock(): Promise<string | null> {
  return verifyWithTs((await cookies()).get(ADMIN_UNLOCK_COOKIE)?.value, ADMIN_TTL_MS);
}

export async function clearAdminUnlock() {
  (await cookies()).delete(ADMIN_UNLOCK_COOKIE);
}

export async function clearAllProfileCookies() {
  const c = await cookies();
  c.delete(ACTIVE_PROFILE_COOKIE);
  c.delete(ADMIN_UNLOCK_COOKIE);
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- lib/session.test.ts`
Expected: all passing. (Tests only import the pure functions, so `next/headers` is never invoked under test.)

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts lib/session.test.ts
git commit -m "feat: signed-cookie session helpers (active profile + admin unlock TTL)"
```

### Task 9: Rate limiter + PIN throttle

**Files:**
- Create: `lib/rate-limit.ts`, `lib/rate-limit.test.ts`

- [ ] **Step 1: Write failing tests**

`lib/rate-limit.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { allow, recordFailure, isLocked, resetFailures } from "./rate-limit";

describe("allow (fixed window)", () => {
  it("permits up to the limit then blocks", () => {
    const key = "k1";
    for (let i = 0; i < 3; i++) expect(allow(key, 3, 10_000)).toBe(true);
    expect(allow(key, 3, 10_000)).toBe(false);
  });
});

describe("PIN throttle", () => {
  it("locks after 5 failures and resets on success", () => {
    const key = "p1";
    resetFailures(key);
    for (let i = 0; i < 5; i++) recordFailure(key, 5, 60_000);
    expect(isLocked(key)).toBe(true);
    resetFailures(key);
    expect(isLocked(key)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect fail**

Run: `npm test -- lib/rate-limit.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/rate-limit.ts`**

```ts
// In-memory limiter. Per-instance only — fine for a single server / dev.
// A durable store (Upstash/Redis) is a later concern (see spec).

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now > w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (w.count >= limit) return false;
  w.count++;
  return true;
}

type Fail = { count: number; lockedUntil: number };
const fails = new Map<string, Fail>();

export function recordFailure(key: string, maxAttempts: number, lockMs: number): void {
  const f = fails.get(key) ?? { count: 0, lockedUntil: 0 };
  f.count++;
  if (f.count >= maxAttempts) f.lockedUntil = Date.now() + lockMs;
  fails.set(key, f);
}

export function isLocked(key: string): boolean {
  const f = fails.get(key);
  return !!f && f.lockedUntil > Date.now();
}

export function resetFailures(key: string): void {
  fails.delete(key);
}
```

- [ ] **Step 4: Run — expect pass**

Run: `npm test -- lib/rate-limit.test.ts`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts lib/rate-limit.test.ts
git commit -m "feat: in-memory rate limiter + PIN-attempt throttle"
```

---

## Phase D — Account resolution & auth wiring

### Task 10: `lib/accounts.ts` — RPC wrappers + resolution helpers

**Files:**
- Create: `lib/accounts.ts`

- [ ] **Step 1: Implement the wrappers**

```ts
import "server-only";
import { getSupabaseAnon } from "@/lib/supabase";
import { getActiveProfile } from "@/lib/session";

export type Profile = {
  id: string; kind: "adult" | "child"; is_owner: boolean;
  display_name: string; avatar: string; has_pin: boolean;
};

/** Ensure an account+owner profile exists for this email; returns account id. */
export async function ensureAccount(email: string): Promise<string | null> {
  const sb = getSupabaseAnon();
  if (!sb) return null;
  const { data, error } = await sb.rpc("create_account", { p_email: email });
  if (error) throw new Error(error.message);
  return data?.[0]?.account_id ?? null;
}

export async function accountIdForEmail(email: string): Promise<string | null> {
  // create_account is idempotent (on conflict), so reuse it as a getter.
  return ensureAccount(email);
}

export async function listProfiles(accountId: string): Promise<Profile[]> {
  const sb = getSupabaseAnon();
  if (!sb) return [];
  const { data, error } = await sb.rpc("list_profiles", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function accountHasChildren(accountId: string): Promise<boolean> {
  const sb = getSupabaseAnon();
  if (!sb) return false;
  const { data, error } = await sb.rpc("account_has_children", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function adminPinIsSet(accountId: string): Promise<boolean> {
  const sb = getSupabaseAnon();
  if (!sb) return false;
  const { data, error } = await sb.rpc("admin_pin_is_set", { p_account_id: accountId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function verifyProfilePin(personId: string, pin: string): Promise<boolean> {
  const sb = getSupabaseAnon();
  if (!sb) return false;
  const { data, error } = await sb.rpc("verify_profile_pin", { p_person_id: personId, p_pin: pin });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function verifyAdminPin(accountId: string, pin: string): Promise<boolean> {
  const sb = getSupabaseAnon();
  if (!sb) return false;
  const { data, error } = await sb.rpc("verify_admin_pin", { p_account_id: accountId, p_pin: pin });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function createProfile(
  accountId: string, kind: "adult" | "child", name: string, avatar: string, pin: string | null) {
  const sb = getSupabaseAnon();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("create_profile", {
    p_account_id: accountId, p_kind: kind, p_name: name, p_avatar: avatar, p_pin: pin,
  });
  if (error) throw new Error(error.message);
}

export async function setAdminPin(accountId: string, pin: string) {
  const sb = getSupabaseAnon();
  if (!sb) throw new Error("Supabase not configured");
  const { error } = await sb.rpc("set_admin_pin", { p_account_id: accountId, p_pin: pin });
  if (error) throw new Error(error.message);
}

/** The active profile, verified to belong to `accountId`. Null if mismatch/missing. */
export async function resolveActiveProfile(accountId: string): Promise<Profile | null> {
  const personId = await getActiveProfile();
  if (!personId) return null;
  const profiles = await listProfiles(accountId);
  return profiles.find((p) => p.id === personId) ?? null;
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors. (Add `import "server-only"` dep if missing: `npm install server-only`.)

- [ ] **Step 3: Commit**

```bash
git add lib/accounts.ts package.json package-lock.json
git commit -m "feat: account/profile resolution helpers over RPCs"
```

### Task 11: Harden `auth.ts` — remove demo, drop dangerous linking, onboard account

**Files:**
- Modify: `auth.ts`

- [ ] **Step 1: Remove the demo Credentials provider**

Delete the entire `Credentials({ id: "demo", ... })` block and the `import Credentials from "next-auth/providers/credentials";` line. The `providers` array now starts empty and only Google/Resend are pushed conditionally. Replace:
```ts
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "demo",
    ...
  }),
];
```
with:
```ts
const providers: NextAuthConfig["providers"] = [];
```

- [ ] **Step 2: Drop dangerous account linking**

In the Google provider block, remove the line:
```ts
      allowDangerousEmailAccountLinking: true,
```

- [ ] **Step 3: Create the account on sign-in**

Add a `signIn` callback that provisions the account (idempotent). In the `callbacks` object add:
```ts
    async signIn({ user }) {
      if (user?.email) {
        try {
          const { ensureAccount } = await import("@/lib/accounts");
          await ensureAccount(user.email);
        } catch {
          // never block login on provisioning hiccups; entry routing will retry
        }
      }
      return true;
    },
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add auth.ts
git commit -m "feat(auth): remove demo login, drop dangerous linking, provision account on sign-in"
```

---

## Phase E — Profile picker & PIN flow

### Task 12: Profile picker server actions

**Files:**
- Create: `app/app/profiles/actions.ts`

- [ ] **Step 1: Implement the actions**

```ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, verifyProfilePin, createProfile } from "@/lib/accounts";
import { setActiveProfile, clearAllProfileCookies } from "@/lib/session";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

async function requireAccount(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const accountId = await accountIdForEmail(email);
  if (!accountId) redirect("/login");
  return accountId;
}

export async function pickProfile(formData: FormData) {
  const accountId = await requireAccount();
  const personId = String(formData.get("personId") || "");
  const pin = String(formData.get("pin") || "");

  const profiles = await listProfiles(accountId);
  const profile = profiles.find((p) => p.id === personId);
  if (!profile) redirect("/app/profiles?error=notfound");

  if (profile.has_pin) {
    const lockKey = `pin:${personId}`;
    if (isLocked(lockKey)) redirect("/app/profiles?error=locked");
    const ok = await verifyProfilePin(personId, pin);
    if (!ok) {
      recordFailure(lockKey, 5, 60_000);
      redirect(`/app/profiles?pinFor=${personId}&error=badpin`);
    }
    resetFailures(lockKey);
  }

  await setActiveProfile(personId);
  redirect("/app");
}

export async function addProfile(formData: FormData) {
  const accountId = await requireAccount();
  const kind = String(formData.get("kind") || "child") as "adult" | "child";
  const name = String(formData.get("name") || "").trim().slice(0, 40) || "New profile";
  const avatar = String(formData.get("avatar") || "🙂");
  const pin = String(formData.get("pin") || "").trim() || null;
  await createProfile(accountId, kind, name, avatar, pin);
  redirect("/app/profiles");
}

export async function switchProfile() {
  await clearAllProfileCookies();
  redirect("/app/profiles");
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/app/profiles/actions.ts
git commit -m "feat: profile picker server actions (pick/add/switch) with PIN throttle"
```

### Task 13: Profile picker page + client UI (auto-skip single profile)

**Files:**
- Create: `app/app/profiles/page.tsx`, `app/app/profiles/PickerClient.tsx`

- [ ] **Step 1: Implement the page (server component)**

`app/app/profiles/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, accountHasChildren } from "@/lib/accounts";
import { setActiveProfile } from "@/lib/session";
import { PickerClient } from "./PickerClient";

export const dynamic = "force-dynamic";

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ pinFor?: string; error?: string; choose?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");

  const profiles = await listProfiles(accountId);
  const sp = await searchParams;

  // Auto-skip: a single profile with no PIN goes straight in, unless the user
  // explicitly asked to choose (?choose=1).
  if (profiles.length === 1 && !profiles[0].has_pin && sp.choose !== "1") {
    await setActiveProfile(profiles[0].id);
    redirect("/app");
  }

  const hasChildren = await accountHasChildren(accountId);
  return (
    <PickerClient
      profiles={profiles}
      hasChildren={hasChildren}
      pinFor={sp.pinFor ?? null}
      error={sp.error ?? null}
    />
  );
}
```

- [ ] **Step 2: Implement the client UI**

`app/app/profiles/PickerClient.tsx`:
```tsx
"use client";

import type { Profile } from "@/lib/accounts";
import { pickProfile, switchProfile } from "./actions";

export function PickerClient({
  profiles, hasChildren, pinFor, error,
}: {
  profiles: Profile[]; hasChildren: boolean; pinFor: string | null; error: string | null;
}) {
  return (
    <div className="login-shell">
      <div className="login-card" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 28 }}>Who&apos;s here? 🐟</h1>
        {error && (
          <p className="tiny" style={{ color: "#E85C47", marginTop: 8 }}>
            {error === "badpin" ? "That PIN didn't match — try again."
              : error === "locked" ? "Too many tries. Wait a minute and try again."
              : "Something went off. Try again."}
          </p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 16, marginTop: 20 }}>
          {profiles.map((p) => (
            <form action={pickProfile} key={p.id} style={{ textAlign: "center" }}>
              <input type="hidden" name="personId" value={p.id} />
              <button className="card" type="submit" style={{ width: "100%", padding: 16, cursor: "pointer" }}>
                <div style={{ fontSize: 40 }}>{p.avatar}</div>
                <div style={{ fontWeight: 800, marginTop: 6 }}>{p.display_name}</div>
                {p.has_pin && <div className="tiny muted">🔒 PIN</div>}
              </button>
              {pinFor === p.id && (
                <input className="login-input" name="pin" inputMode="numeric" autoFocus
                  placeholder="Enter PIN" style={{ marginTop: 8 }} />
              )}
            </form>
          ))}
        </div>

        {hasChildren && (
          <a className="btn btn-ghost" href="/app/admin" style={{ marginTop: 20, justifyContent: "center" }}>
            🔐 Enter family / admin zone
          </a>
        )}

        <form action={switchProfile} style={{ marginTop: 12 }}>
          <button className="btn btn-ghost" type="submit" style={{ width: "100%", justifyContent: "center" }}>
            Sign out of this device
          </button>
        </form>
      </div>
    </div>
  );
}
```
> Note: "Add profile" UI is intentionally minimal here; the full add-profile form (kind/name/avatar/PIN + first-child admin-PIN setup) lives in the admin zone (Task 15). This keeps the picker safe for kids.

- [ ] **Step 3: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: compiles.

- [ ] **Step 4: Commit**

```bash
git add app/app/profiles/page.tsx app/app/profiles/PickerClient.tsx
git commit -m "feat: profile picker page with auto-skip for single profile"
```

---

## Phase F — Admin / guardian zone

### Task 14: Admin zone gate + actions

**Files:**
- Create: `app/app/admin/actions.ts`, `app/app/admin/AdminGate.tsx`, `app/app/admin/page.tsx`

- [ ] **Step 1: Implement admin actions**

`app/app/admin/actions.ts`:
```ts
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, verifyAdminPin, setAdminPin, createProfile } from "@/lib/accounts";
import { setAdminUnlock } from "@/lib/session";
import { isLocked, recordFailure, resetFailures } from "@/lib/rate-limit";

async function requireAccount(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const id = await accountIdForEmail(email);
  if (!id) redirect("/login");
  return id;
}

export async function unlockAdmin(formData: FormData) {
  const accountId = await requireAccount();
  const pin = String(formData.get("pin") || "");
  const lockKey = `admin:${accountId}`;
  if (isLocked(lockKey)) redirect("/app/admin?error=locked");
  const ok = await verifyAdminPin(accountId, pin);
  if (!ok) {
    recordFailure(lockKey, 5, 60_000);
    redirect("/app/admin?error=badpin");
  }
  resetFailures(lockKey);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function setupAdminPin(formData: FormData) {
  const accountId = await requireAccount();
  const pin = String(formData.get("pin") || "").trim();
  if (pin.length < 4) redirect("/app/admin?error=shortpin");
  await setAdminPin(accountId, pin);
  await setAdminUnlock(accountId);
  redirect("/app/admin");
}

export async function addChildProfile(formData: FormData) {
  const accountId = await requireAccount();
  const name = String(formData.get("name") || "").trim().slice(0, 40) || "Kiddo";
  const avatar = String(formData.get("avatar") || "🦄");
  const pin = String(formData.get("pin") || "").trim() || null;
  await createProfile(accountId, "child", name, avatar, pin);
  redirect("/app/admin");
}
```

- [ ] **Step 2: Implement the gate client**

`app/app/admin/AdminGate.tsx`:
```tsx
"use client";
import { unlockAdmin, setupAdminPin } from "./actions";

export function AdminGate({ needsSetup, error }: { needsSetup: boolean; error: string | null }) {
  const action = needsSetup ? setupAdminPin : unlockAdmin;
  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 style={{ fontSize: 26 }}>{needsSetup ? "Set an admin PIN 🔐" : "Admin / family zone 🔐"}</h1>
        <p className="tiny muted" style={{ marginTop: 8 }}>
          {needsSetup
            ? "Create a PIN to manage profiles and family settings. You'll need it before adding a child profile."
            : "Enter your admin PIN to continue."}
        </p>
        {error && <p className="tiny" style={{ color: "#E85C47", marginTop: 8 }}>
          {error === "badpin" ? "Wrong PIN." : error === "locked" ? "Too many tries — wait a minute."
            : error === "shortpin" ? "PIN must be at least 4 digits." : "Try again."}
        </p>}
        <form action={action} style={{ marginTop: 16 }}>
          <input className="login-input" name="pin" inputMode="numeric" autoFocus placeholder="PIN" />
          <button className="btn btn-gold" type="submit" style={{ width: "100%", marginTop: 10, justifyContent: "center" }}>
            {needsSetup ? "Set PIN" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement the admin page**

`app/app/admin/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { accountIdForEmail, listProfiles, adminPinIsSet } from "@/lib/accounts";
import { getAdminUnlock } from "@/lib/session";
import { AdminGate } from "./AdminGate";
import { addChildProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");
  const sp = await searchParams;

  const unlocked = (await getAdminUnlock()) === accountId;
  const pinSet = await adminPinIsSet(accountId);

  if (!unlocked) {
    return <AdminGate needsSetup={!pinSet} error={sp.error ?? null} />;
  }

  const profiles = await listProfiles(accountId);
  return (
    <div style={{ padding: 28, maxWidth: 900, margin: "0 auto" }}>
      <h1>Family / admin</h1>
      <h2 style={{ marginTop: 20 }}>Profiles</h2>
      <ul>
        {profiles.map((p) => (
          <li key={p.id}>{p.avatar} {p.display_name} — {p.kind}{p.is_owner ? " (owner)" : ""}{p.has_pin ? " 🔒" : ""}</li>
        ))}
      </ul>
      <h2 style={{ marginTop: 20 }}>Add a child profile</h2>
      <form action={addChildProfile} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <input className="login-input" name="name" placeholder="Name" />
        <input className="login-input" name="avatar" placeholder="🦄" maxLength={2} style={{ width: 70 }} />
        <input className="login-input" name="pin" inputMode="numeric" placeholder="PIN (optional)" />
        <button className="btn btn-coral" type="submit">Add child</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 24 }}>
        <a href="/app/profiles?choose=1">← Back to profiles</a>
      </p>
    </div>
  );
}
```
> Note: `adminPinIsSet` is backed by the `admin_pin_is_set(account_id)` RPC (added in Task 5), which reports whether `admin_pin_hash` is non-null. So an adult-only owner who sets a PIN is correctly recognized as set-up afterward (no awkward re-prompt). The zone shows the setup form only until a PIN exists; once set, it shows the unlock form.

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: compiles.

- [ ] **Step 5: Commit**

```bash
git add app/app/admin
git commit -m "feat: admin/guardian zone with PIN gate, setup, and add-child"
```

---

## Phase G — Wire the app to the active profile

### Task 15: Entry routing in `app/app/page.tsx`

**Files:**
- Modify: `app/app/page.tsx`

- [ ] **Step 1: Replace the page with active-profile resolution**

Replace the entire contents of `app/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { accountIdForEmail, resolveActiveProfile } from "@/lib/accounts";
import { clearAllProfileCookies } from "@/lib/session";
import { HavenApp } from "@/components/HavenApp";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) redirect("/login");

  const profile = await resolveActiveProfile(accountId);
  if (!profile) redirect("/app/profiles");

  async function handleSignOut() {
    "use server";
    await clearAllProfileCookies();
    await signOut({ redirectTo: "/login" });
  }

  return (
    <HavenApp
      profile={{
        id: profile.id,
        name: profile.display_name,
        avatar: profile.avatar,
        kind: profile.kind,
      }}
      onSignOut={handleSignOut}
    />
  );
}
```

- [ ] **Step 2: Typecheck (expect HavenApp prop error — fixed next task)**

Run: `npm run typecheck`
Expected: error about `HavenApp` props (`profile` not assignable). This is expected; Task 16 updates HavenApp.

- [ ] **Step 3: Commit**

```bash
git add app/app/page.tsx
git commit -m "feat: route to active profile; redirect to picker when none"
```

### Task 16: `HavenApp` uses the active profile + real strikes + kid-safe mode

**Files:**
- Modify: `components/HavenApp.tsx`

- [ ] **Step 1: Change the props interface**

Replace the `SessionUser` interface and the component signature/body header. Replace:
```ts
export interface SessionUser {
  email: string;
  name: string | null;
  image: string | null;
}

export function HavenApp({
  session,
  onSignOut,
}: {
  session: SessionUser;
  onSignOut: () => void | Promise<void>;
}) {
```
with:
```ts
export interface ActiveProfile {
  id: string;
  name: string;
  avatar: string;
  kind: "adult" | "child";
}

export function HavenApp({
  profile,
  onSignOut,
}: {
  profile: ActiveProfile;
  onSignOut: () => void | Promise<void>;
}) {
```

- [ ] **Step 2: Use the profile for display + avatar seed**

Replace:
```ts
  const [avatar, setAvatar] = useState("🦄");
```
with:
```ts
  const [avatar, setAvatar] = useState(profile.avatar || "🦄");
```
and replace:
```ts
  const displayName = session.name || session.email.split("@")[0];
```
with:
```ts
  const displayName = profile.name;
  const isKid = profile.kind === "child";
```

- [ ] **Step 3: Gate the Parents route behind the admin zone**

The in-app "parents" page is now the admin zone. Replace the parents render line:
```tsx
        {route.page === "parents" && <ParentsPage user={user} />}
```
with:
```tsx
        {route.page === "parents" && (
          <div style={{ padding: 28 }}>
            <p>Family settings live in the admin zone.</p>
            <a className="btn btn-gold" href="/app/admin">Open admin zone →</a>
          </div>
        )}
```
(The full `ParentsPage` now renders inside `/app/admin` in a later iteration; for F1 the admin zone owns family management.)

- [ ] **Step 4: Remove the now-unused import if present**

If `ParentsPage` is no longer referenced, remove its import line to satisfy lint:
```ts
import { ParentsPage } from "./screens/ParentsPage";
```

- [ ] **Step 5: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: compiles (app/app/page.tsx error from Task 15 is now resolved).

- [ ] **Step 6: Commit**

```bash
git add components/HavenApp.tsx
git commit -m "feat: HavenApp renders the active profile; route parents to admin zone"
```

### Task 17: Person-keyed activity logging

**Files:**
- Modify: `app/api/activity/route.ts`, `lib/activity.ts`

- [ ] **Step 1: Update `lib/activity.ts` (no signature change needed)**

The client helper already POSTs `{event, data}` to `/api/activity`; no change to its arguments. Only update the file header comment to drop the "email" reference:
```ts
// Client-side helper for logging the active profile's activity to Supabase via
// /api/activity. The server derives the profile from the signed cookie. Fails
// silently so UI interactions never break on network hiccups.
```

- [ ] **Step 2: Rewrite `/api/activity` POST to derive person_id + rate limit**

Replace the `POST` handler body. The new version derives the active profile from the signed cookie, confirms it belongs to the logged-in account, rate-limits, then calls `log_activity`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseAnon } from "@/lib/supabase";
import { accountIdForEmail, resolveActiveProfile } from "@/lib/accounts";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "view_page","post_reaction","send_chat","strike_triggered","pray_for",
  "submit_prayer","doodle_stroke","join_community","create_post",
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) return NextResponse.json({ error: "No account" }, { status: 401 });

  const profile = await resolveActiveProfile(accountId);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 401 });

  if (!allow(`activity:${profile.id}`, 120, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: { event?: string; data?: Record<string, unknown> };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const event = body.event;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const supabase = getSupabaseAnon();
  if (!supabase) return NextResponse.json({ ok: true, stored: false });

  const { error } = await supabase.rpc("log_activity", {
    p_person_id: profile.id,
    p_event: event,
    p_data: body.data ?? {},
    p_user_agent: request.headers.get("user-agent") ?? null,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stored: true });
}
```

- [ ] **Step 3: Rewrite the `GET` handler similarly**

Replace the `GET` handler to use the active profile:
```ts
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accountId = await accountIdForEmail(session.user.email);
  if (!accountId) return NextResponse.json({ error: "No account" }, { status: 401 });
  const profile = await resolveActiveProfile(accountId);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 401 });

  const supabase = getSupabaseAnon();
  if (!supabase) return NextResponse.json({ ok: true, rows: [], stored: false });

  const url = new URL(request.url);
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? "50"));
  const { data, error } = await supabase.rpc("my_activity", {
    p_person_id: profile.id, p_limit: limit,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data ?? [] });
}
```

- [ ] **Step 4: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: compiles.

- [ ] **Step 5: Commit**

```bash
git add app/api/activity/route.ts lib/activity.ts
git commit -m "feat: activity logging keyed to the active profile, rate limited"
```

---

## Phase H — Hardening

### Task 18: Security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add a `headers()` block**

Replace `next.config.ts` with:
```ts
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
```
> Note: `script-src 'unsafe-inline'` is required because the app uses inline styles/Next inline bootstrap; tightening to nonces is a later hardening step. Document this in the commit.

- [ ] **Step 2: Build + start, verify headers**

Run: `npm run build && (npm start &) && sleep 4 && curl -sI http://localhost:3000/login | grep -i "x-frame-options\|content-security-policy"; kill %1 2>/dev/null`
Expected: prints `X-Frame-Options: DENY` and a `Content-Security-Policy` line.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): add CSP, HSTS, X-Frame-Options and related headers"
```

### Task 19: Rate-limit the login-adjacent endpoints

> The PIN actions (Tasks 12 & 14) and `/api/activity` (Task 17) are already throttled. This task adds a coarse IP-based limit to the activity route as defense-in-depth and documents the limiter's per-instance caveat.

**Files:**
- Modify: `app/api/activity/route.ts`

- [ ] **Step 1: Add an IP guard at the top of `POST`**

Immediately after the `session` check in `POST`, add:
```ts
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`activity-ip:${ip}`, 300, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/activity/route.ts
git commit -m "feat(security): coarse IP rate limit on activity ingestion"
```

---

## Phase I — Rebrand & login copy

### Task 20: Haven Kids → FishHaven + remove demo login UI

**Files:**
- Modify: `app/login/page.tsx`, `app/layout.tsx`, `package.json`, `README.md`, `components/screens/CommunityPage.tsx`, `components/screens/ClassroomPage.tsx`, `lib/supabase.ts`

- [ ] **Step 1: Remove the demo block from the login page**

In `app/login/page.tsx`, delete the entire "Demo / bypass — always available" section: the `<div className="row">…OR TRY WITHOUT SIGNUP…</div>` block and the following `<form action={... signIn("demo" ...)}>…</form>` block.

- [ ] **Step 2: Rebrand login copy**

In `app/login/page.tsx`, change `Welcome to Haven Kids` → `Welcome to FishHaven`, and change the heading/subtext to all-ages framing:
- `Come on in, friend 💛` → keep.
- The two `hasGoogle || hasResend` copy strings: replace `"Try it out as a demo kid — Gabriel is waiting."` with `"Sign in with Google or get a magic link by email."` (the demo path is gone).

- [ ] **Step 3: Update metadata**

In `app/layout.tsx`:
```ts
  title: "FishHaven — A Christian Community for Everyone",
  description:
    "A safe, AI-moderated community platform for Christians of all ages — individuals, families, and communities. Discover communities, share resources, pray together, and grow together.",
```
Change the favicon emoji from `😇` to `🐟` (replace `%2290%22>😇` with `%2290%22>🐟`).

- [ ] **Step 4: Rename the package**

In `package.json`: `"name": "haven-kids"` → `"name": "fishhaven"`.

- [ ] **Step 5: Replace remaining brand strings**

- `README.md` line 1: `# Haven Kids` → `# FishHaven`.
- `components/screens/CommunityPage.tsx:528`: `A warm, safe corner of Haven Kids` → `A warm, safe corner of FishHaven`.
- `components/screens/ClassroomPage.tsx:2` comment: `Haven Kids` → `FishHaven`.
- `lib/supabase.ts` comments mentioning `Haven Kids` → `FishHaven`; the two `X-Client-Info` header values `"haven-kids"`/`"haven-kids-admin"` → `"fishhaven"`/`"fishhaven-admin"`.

> Internal identifiers (`HavenApp`, `HAVEN_DATA`, the `haven-*` CSS class names) are left unchanged in F1 to avoid wide churn; they are not user-visible. A rename is a separate cleanup if desired.

- [ ] **Step 6: Typecheck + lint + build**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add app/login/page.tsx app/layout.tsx package.json README.md components/screens/CommunityPage.tsx components/screens/ClassroomPage.tsx lib/supabase.ts
git commit -m "feat: rebrand Haven Kids -> FishHaven (all-ages) and remove demo login UI"
```

---

## Phase J — Final verification

### Task 21: Full verification + manual smoke

**Files:** none (verification only).

- [ ] **Step 1: Run the full automated suite**

Run:
```bash
npm run typecheck && npm run lint && npm test && npm run build
```
Expected: typecheck clean, lint clean (or only pre-existing non-touched warnings), all Vitest tests pass, build succeeds.

- [ ] **Step 2: Run the SQL test suite**

Run: `npx supabase db reset && npx supabase test db`
Expected: `f1_identity.test.sql` — 24/24 passing.

- [ ] **Step 3: Manual smoke (requires `.env.local` with AUTH_SECRET + Supabase + a provider)**

Run `npm run dev` and verify by hand:
- Visiting `/app` while logged out → redirected to `/login`.
- The login page shows Google/email only — **no demo button**.
- First login → lands straight in the app (single owner profile, no picker).
- In `/app/admin` → set an admin PIN, add a child profile.
- Sign out, sign back in → now the **picker** appears (2 profiles).
- Picking the PIN-protected child prompts for a PIN; wrong PIN 5× → locked message.
- `/app/admin` requires the admin PIN; a wrong PIN keeps it locked.
- Navigating pages writes rows: check `select * from public.activity` shows `person_id` populated.

- [ ] **Step 4: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "chore: F1 verification fixes" || echo "nothing to commit"
```

---

## Self-review notes (author)

- **Spec coverage:** accounts/people/activity/strikes tables + RPCs (Tasks 4–7); signed cookie session (Task 8); rate limit + PIN throttle (Task 9); remove demo + drop dangerous linking + onboarding (Task 11); picker w/ auto-skip + PIN (Tasks 12–13); admin zone w/ PIN, setup, add-child (Task 14); active-profile routing + kid-safe flag (Tasks 15–16); person-keyed activity (Task 17); security headers + rate limit (Tasks 18–19); rebrand + demo UI removal (Task 20); ESLint (Task 1). All spec sections map to a task.
- **Deviations from spec (intentional):** PIN hashing is bcrypt (pgcrypto) not scrypt; the full `ParentsPage` content is hosted by the admin zone iteratively (F1 ships the gate + add-child management). Both noted inline.
- **Known limitation:** the in-memory rate limiter/throttle is per-server-instance (fine for single-instance/dev; a durable store is future work, per spec).
- **Type consistency:** `Profile` shape (id/kind/is_owner/display_name/avatar/has_pin) is defined once in `lib/accounts.ts` and reused; `ActiveProfile` (id/name/avatar/kind) is the HavenApp prop shape, mapped in `app/app/page.tsx`.
