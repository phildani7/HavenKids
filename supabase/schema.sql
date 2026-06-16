-- FishHaven — Supabase schema (full current state).
-- Source of truth for migrations is supabase/migrations/. This file mirrors the
-- final state so it can be run once in the SQL editor. Idempotent.

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

-- ---- Identity RPCs (SECURITY DEFINER) ----

create or replace function public.create_account(p_email text)
returns table(account_id uuid, owner_person_id uuid)
language plpgsql security definer set search_path = public as $$
declare a_id uuid; p_id uuid;
begin
  insert into public.accounts (owner_email) values (p_email)
  on conflict (owner_email) do update set owner_email = excluded.owner_email
  returning id into a_id;

  select id into p_id from public.people where people.account_id = a_id and is_owner;
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

-- ---- Lock down RPC execution ----
-- SECURITY DEFINER controls what a function does, NOT who may call it. By default
-- every public function is executable by the anon role, and the anon key is public.
-- That would expose verify_admin_pin / verify_profile_pin to offline-free PIN
-- brute force and let anyone spam create_account. These RPCs are called ONLY by
-- the trusted Next.js server using the server-only service-role key, so revoke
-- EXECUTE from the public/anon/authenticated roles and grant it to service_role.
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;

-- ============================================================
-- 2. Auth.js (next-auth) adapter tables
-- Auth.js uses these to persist verification tokens and
-- linked Google accounts. Schema must match @auth/supabase-adapter.
-- See https://authjs.dev/getting-started/adapters/supabase
-- ============================================================
create schema if not exists next_auth;

grant usage on schema next_auth to service_role;
grant all on all tables    in schema next_auth to service_role;
grant all on all sequences in schema next_auth to service_role;
grant all on all functions in schema next_auth to service_role;

create table if not exists next_auth.users (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text unique,
  "emailVerified" timestamptz,
  image         text
);

create table if not exists next_auth.accounts (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references next_auth.users(id) on delete cascade,
  type                text not null,
  provider            text not null,
  "providerAccountId" text not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  oauth_token_secret  text,
  oauth_token         text,
  unique (provider, "providerAccountId")
);

create table if not exists next_auth.sessions (
  id            uuid primary key default gen_random_uuid(),
  "userId"      uuid not null references next_auth.users(id) on delete cascade,
  expires       timestamptz not null,
  "sessionToken" text not null unique
);

create table if not exists next_auth.verification_tokens (
  identifier text not null,
  token      text not null unique,
  expires    timestamptz not null,
  primary key (identifier, token)
);
