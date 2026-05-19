-- Haven Kids — Supabase schema
-- Run once in the Supabase SQL editor (or via `supabase db push`).
-- This script is idempotent.

-- ============================================================
-- 1. Activity sheet (the "activity sheet" backend)
-- ============================================================
create table if not exists public.activity (
  id          bigserial primary key,
  email       text not null,
  event       text not null,
  data        jsonb not null default '{}'::jsonb,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_email_created_idx
  on public.activity (email, created_at desc);

create index if not exists activity_event_created_idx
  on public.activity (event, created_at desc);

alter table public.activity enable row level security;

-- Service-role bypasses RLS, so these policies keep anon/authenticated
-- users from reading anyone else's rows if they somehow get a JWT.
drop policy if exists "activity_self_select" on public.activity;
create policy "activity_self_select"
  on public.activity for select
  using (auth.jwt() ->> 'email' = email);

drop policy if exists "activity_block_direct_write" on public.activity;
create policy "activity_block_direct_write"
  on public.activity for insert
  with check (false);

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
