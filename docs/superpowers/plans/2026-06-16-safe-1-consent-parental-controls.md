# SAFE-1 — Consent & Parental Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. TDD, frequent commits.

**Goal:** A child profile is inactive until a parent records (immutable, revocable) consent; child data is minimal and parent-managed (view/export/delete); UK/EU are geo-blocked.

**Architecture:** Extends F1 — new `consents` + `safety_audit` tables and service-role RPCs; activation gating in the existing resolve/pick paths; consent step + data dashboard in the F1 admin zone; geo gate in middleware. All authZ via the F1 `lib/guards.ts`.

**Spec:** `docs/superpowers/specs/2026-06-16-safe-1-consent-parental-controls-design.md` · **Rules:** `docs/superpowers/safe-0/00-compliance-foundation.md`

**Conventions:** run from repo root; RPCs are `language sql/plpgsql security definer set search_path = public, extensions`; DB changes verified on real Supabase in a rolled-back transaction (no Docker). Build order is **DB → lib → gating → admin UI → geo → verify**.

---

## Batch A — DB layer (migration + pgTAP; verify on real Supabase)

**Files:** create `supabase/migrations/20260616000000_safe1_consent.sql`, extend `supabase/schema.sql`, create `supabase/tests/safe1_consent.test.sql`.

Migration content:
```sql
-- SAFE-1 — consent & parental controls
alter table public.people add column if not exists age_band text
  check (age_band in ('under_13','13_17','adult')) default 'adult';
update public.people set age_band = 'adult' where age_band is null;
alter table public.people alter column age_band set not null;

create table if not exists public.consents (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.accounts(id) on delete cascade,
  person_id      uuid not null references public.people(id) on delete cascade,
  scope          text not null,
  method         text not null,
  notice_version text not null,
  country        text,
  created_at     timestamptz not null default now(),
  revoked_at     timestamptz
);
create index if not exists consents_person_active_idx
  on public.consents (person_id) where revoked_at is null;
alter table public.consents enable row level security;

create table if not exists public.safety_audit (
  id               bigserial primary key,
  account_id       uuid,
  actor_person_id  uuid,
  action           text not null,
  target_person_id uuid,
  detail           jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
alter table public.safety_audit enable row level security;

create or replace function public.child_is_active(p_person_id uuid)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists(select 1 from public.consents
                where person_id = p_person_id and revoked_at is null);
$$;

create or replace function public.record_consent(
  p_account_id uuid, p_person_id uuid, p_scope text, p_method text,
  p_notice_version text, p_country text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare cid uuid;
begin
  if not exists(select 1 from public.people
                where id = p_person_id and account_id = p_account_id and kind = 'child') then
    raise exception 'person is not a child of this account';
  end if;
  insert into public.consents (account_id, person_id, scope, method, notice_version, country)
  values (p_account_id, p_person_id, p_scope, p_method, p_notice_version, p_country)
  returning id into cid;
  insert into public.safety_audit (account_id, target_person_id, action, detail)
  values (p_account_id, p_person_id, 'consent_granted',
          jsonb_build_object('scope',p_scope,'method',p_method,'notice_version',p_notice_version));
  return cid;
end $$;

create or replace function public.revoke_consent(p_account_id uuid, p_person_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.consents set revoked_at = now()
  where person_id = p_person_id and account_id = p_account_id and revoked_at is null;
  insert into public.safety_audit (account_id, target_person_id, action)
  values (p_account_id, p_person_id, 'consent_revoked');
end $$;

create or replace function public.export_child_data(p_account_id uuid, p_person_id uuid)
returns jsonb language sql security definer set search_path = public, extensions as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'pin_hash' from public.people p
                where p.id = p_person_id and p.account_id = p_account_id),
    'activity', (select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) from public.activity a where a.person_id = p_person_id),
    'strikes',  (select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) from public.strikes s where s.person_id = p_person_id),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) from public.consents c where c.person_id = p_person_id)
  );
$$;

create or replace function public.delete_child_data(
  p_account_id uuid, p_person_id uuid, p_keep_profile boolean default false)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists(select 1 from public.people where id = p_person_id and account_id = p_account_id) then
    raise exception 'person not in account';
  end if;
  update public.consents set revoked_at = coalesce(revoked_at, now())
    where person_id = p_person_id and account_id = p_account_id;   -- revoke (retain proof)
  delete from public.activity where person_id = p_person_id;
  delete from public.strikes  where person_id = p_person_id;
  if not p_keep_profile then
    delete from public.people where id = p_person_id and account_id = p_account_id;
  end if;
  insert into public.safety_audit (account_id, target_person_id, action, detail)
  values (p_account_id, p_person_id, 'child_data_deleted', jsonb_build_object('kept_profile',p_keep_profile));
end $$;

-- extend create_profile to set age_band for children
create or replace function public.create_profile(
  p_account_id uuid, p_kind text, p_name text, p_avatar text,
  p_pin text default null, p_age_band text default 'adult')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
  if p_kind not in ('adult','child') then raise exception 'invalid kind %', p_kind; end if;
  if p_kind = 'child' and (select admin_pin_hash from public.accounts where id = p_account_id) is null then
    raise exception 'admin pin must be set before adding a child profile'; end if;
  insert into public.people (account_id, kind, is_owner, display_name, avatar, pin_hash, age_band)
  values (p_account_id, p_kind, false, p_name, p_avatar,
          case when p_pin is null then null else crypt(p_pin, gen_salt('bf')) end,
          case when p_kind = 'child' then coalesce(nullif(p_age_band,''),'13_17') else 'adult' end)
  returning id into new_id;
  return new_id;
end $$;

-- extend list_profiles to surface age_band + is_active
create or replace function public.list_profiles(p_account_id uuid)
returns table(id uuid, kind text, is_owner boolean, display_name text,
              avatar text, has_pin boolean, age_band text, is_active boolean)
language sql security definer set search_path = public, extensions as $$
  select p.id, p.kind, p.is_owner, p.display_name, p.avatar, (p.pin_hash is not null),
         p.age_band,
         (p.kind = 'adult' or exists(select 1 from public.consents c
            where c.person_id = p.id and c.revoked_at is null)) as is_active
  from public.people p where p.account_id = p_account_id
  order by p.is_owner desc, p.created_at asc;
$$;

-- new functions need EXECUTE locked to service_role (F1's grant predates them)
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;
```

Tasks:
- [ ] Write `supabase/tests/safe1_consent.test.sql` (pgTAP) asserting: age_band column + default; record_consent (child-of-account only — throws for non-child / wrong account); child_is_active false before, true after, false after revoke; list_profiles returns age_band + is_active (adult always active); export_child_data shape (no pin_hash); delete_child_data erases activity+strikes, keeps consents, removes profile when not kept; new RPCs not executable by anon (`has_function_privilege`). Use `plan(N)`.
- [ ] Write the migration above; mirror into `supabase/schema.sql`.
- [ ] **Verify on real Supabase** via MCP in a `begin … rollback;` transaction (apply F1 + SAFE-1 objects + run the assertions). Expect all pass.
- [ ] Commit.

## Batch B — lib wrappers + activation gating

**Files:** modify `lib/accounts.ts`, `lib/guards.ts`, `app/app/profiles/actions.ts`, `app/app/page.tsx`.
- [ ] `lib/accounts.ts`: add `Profile.age_band` + `Profile.is_active`; wrappers `recordConsent`, `revokeConsent`, `childIsActive`, `exportChildData`, `deleteChildData`; `createProfile` accepts `ageBand`. (Service-role, mirror existing wrappers; throw on RPC error.)
- [ ] **Activation gating:** `resolveActiveProfile` returns the profile but callers must reject inactive children. Add to `pickProfile`: after resolving the picked profile, if `profile.kind==='child' && !profile.is_active` → `redirect("/app/profiles?error=needsconsent")`. In `app/app/page.tsx`: if the active `profile` is a child and not active → `redirect("/app/profiles")`.
- [ ] Typecheck; commit.

## Batch C — admin UI: consent step + parental data dashboard

**Files:** modify `app/app/admin/actions.ts`, `app/app/admin/page.tsx`, `app/app/admin/AdminGate.tsx` (only if needed).
- [ ] `addChildProfile` action: require an attestation checkbox + age_band in the form; create the profile then call `recordConsent(accountId, newPersonId, 'service_v1', 'parent_attestation_v1', NOTICE_VERSION, country)`. (Get `country` from a header/util; pass null if unknown.) Reject if attestation not checked.
- [ ] New actions: `revokeConsentAction(personId)`, `deleteChildAction(personId)`, `exportChildAction(personId)` (returns JSON; the page offers it as a download). All `requireActiveAdult` + `requireAdminUnlock` + verify person∈account.
- [ ] `admin/page.tsx`: the add-child form gains an age-band select + a notice summary + attestation checkbox. The profiles list shows, per child: consent status (active/pending/revoked) + **Revoke**, **Export**, **Delete** buttons.
- [ ] Render the consent notice text (from `safe-0/privacy-notice-*.md`, inlined as a constant for now) at the add-child step.
- [ ] Typecheck + build + lint; commit.

## Batch D — UK/EU geo-restriction

**Files:** create `lib/geo.ts`, a region-blocked page `app/blocked/page.tsx`; modify `middleware.ts`.
- [ ] `lib/geo.ts`: `const BLOCKED = new Set([... ISO codes: GB + EEA ...]); export function isBlocked(country?: string){ return !!country && BLOCKED.has(country); }` (Vitest test: GB/DE blocked, US/IN allowed, undefined allowed).
- [ ] `middleware.ts`: read country (`req.geo?.country` on Vercel; undefined elsewhere). If `isBlocked` and path isn't already `/blocked` → rewrite/redirect to `/blocked`. Keep the existing auth gating.
- [ ] `app/blocked/page.tsx`: simple "FishHaven isn't available in your region yet" page.
- [ ] Typecheck + build + lint; commit.

## Batch E — verification & review
- [ ] `npm run typecheck && npm run lint && npm test && npm run build` — all green.
- [ ] Re-run the SAFE-1 pgTAP assertions on real Supabase (rolled-back tx).
- [ ] Dispatch a security/spec reviewer over the SAFE-1 diff (authZ on new actions, consent-gating can't be bypassed by a child, export/delete verify account ownership, geo logic).
- [ ] Manual smoke notes (needs env): add child → must attest → child pending until consent → usable; revoke → child locked; export downloads JSON; delete erases; UK IP → /blocked.

## Self-review notes
- Spec coverage: R1–R4 (consent, immutable, revocable, attestation) Batch A+C; R5 (age_band, minimization) A+C; R7 (no-tracking — standing rule, no tracker added); R8 (view/export/delete) A+C; R14 (retention/erasure) A; R16 (geo) D; audit log A. 
- New RPCs re-lock EXECUTE to service_role (F1's grant predates them) — don't forget (in the migration).
- `delete_child_data` retains `consents` (proof) + does not touch `safety_audit`/incidents — per R14.
