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
  age_band     text not null default 'adult' check (age_band in ('under_13','13_17','adult')),
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- exactly one owner profile per account
create unique index if not exists people_one_owner_per_account
  on public.people (account_id) where is_owner;

create index if not exists people_account_idx on public.people (account_id);

alter table public.accounts enable row level security;
alter table public.people   enable row level security;
-- No anon policies: all access is via SECURITY DEFINER RPCs from the trusted server.

-- SAFE-1: consent records (immutable; revoke sets revoked_at) + safety audit log
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

-- ---- Identity RPCs (SECURITY DEFINER) ----

create or replace function public.create_account(p_email text)
returns table(account_id uuid, owner_person_id uuid)
language plpgsql security definer set search_path = public, extensions as $$
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

-- Read-only account lookup for the hot path (every request resolves the account).
-- create_account is an upsert (a write); use this for reads so a flood of
-- authenticated requests does not become a flood of writes.
create or replace function public.account_id_for_email(p_email text)
returns uuid language sql security definer set search_path = public, extensions as $$
  select id from public.accounts where owner_email = p_email;
$$;

create or replace function public.set_admin_pin(p_account_id uuid, p_pin text)
returns void language sql security definer set search_path = public, extensions as $$
  update public.accounts set admin_pin_hash = crypt(p_pin, gen_salt('bf'))
  where id = p_account_id;
$$;

create or replace function public.verify_admin_pin(p_account_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select coalesce(
    (select admin_pin_hash = crypt(p_pin, admin_pin_hash)
       from public.accounts where id = p_account_id and admin_pin_hash is not null),
    false);
$$;

create or replace function public.account_has_children(p_account_id uuid)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists(select 1 from public.people where account_id = p_account_id and kind = 'child');
$$;

create or replace function public.admin_pin_is_set(p_account_id uuid)
returns boolean language sql security definer set search_path = public, extensions as $$
  select coalesce((select admin_pin_hash is not null
                     from public.accounts where id = p_account_id), false);
$$;

create or replace function public.create_profile(
  p_account_id uuid, p_kind text, p_name text, p_avatar text,
  p_pin text default null, p_age_band text default 'adult')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
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
  insert into public.people (account_id, kind, is_owner, display_name, avatar, pin_hash, age_band)
  values (p_account_id, p_kind, false, p_name, p_avatar,
          case when p_pin is null then null else crypt(p_pin, gen_salt('bf')) end,
          case when p_kind = 'child' then coalesce(nullif(p_age_band,''),'13_17') else 'adult' end)
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.verify_profile_pin(p_person_id uuid, p_pin text)
returns boolean language sql security definer set search_path = public, extensions as $$
  select coalesce(
    (select pin_hash = crypt(p_pin, pin_hash)
       from public.people where id = p_person_id and pin_hash is not null),
    false);
$$;

create or replace function public.list_profiles(p_account_id uuid)
returns table(id uuid, kind text, is_owner boolean, display_name text,
              avatar text, has_pin boolean, age_band text, is_active boolean)
language sql security definer set search_path = public, extensions as $$
  select p.id, p.kind, p.is_owner, p.display_name, p.avatar, (p.pin_hash is not null),
         p.age_band,
         (p.kind = 'adult' or exists(select 1 from public.consents c
            where c.person_id = p.id and c.revoked_at is null)) as is_active
  from public.people p where p.account_id = p_account_id and p.deleted_at is null
  order by p.is_owner desc, p.created_at asc;
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
-- guard: a legacy/partial state could leave NULL person_id rows, which would
-- abort the SET NOT NULL below. We have no email->person mapping, so drop them.
delete from public.activity where person_id is null;
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
returns void language sql security definer set search_path = public, extensions as $$
  insert into public.activity (person_id, event, data, user_agent)
  values (p_person_id, p_event, coalesce(p_data,'{}'::jsonb), p_user_agent);
$$;

create or replace function public.my_activity(p_person_id uuid, p_limit int)
returns table(event text, data jsonb, created_at timestamptz)
language sql security definer set search_path = public, extensions as $$
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
returns void language sql security definer set search_path = public, extensions as $$
  insert into public.strikes (person_id, reason) values (p_person_id, p_reason);
$$;

create or replace function public.clear_strikes(p_person_id uuid)
returns void language sql security definer set search_path = public, extensions as $$
  update public.strikes set cleared_at = now()
  where person_id = p_person_id and cleared_at is null;
$$;

create or replace function public.active_strikes(p_person_id uuid)
returns int language sql security definer set search_path = public, extensions as $$
  select count(*)::int from public.strikes
  where person_id = p_person_id and cleared_at is null;
$$;

-- ---- SAFE-1 consent & parental-control RPCs ----
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

-- Soft-delete: erase PII + activity/strikes, keep an anonymized row so the
-- (revoked) consent proof stays linked (R14). A hard delete would cascade-delete consents.
create or replace function public.delete_child_data(p_account_id uuid, p_person_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists(select 1 from public.people
                where id = p_person_id and account_id = p_account_id and kind = 'child') then
    raise exception 'person is not a child of this account';
  end if;
  update public.consents set revoked_at = coalesce(revoked_at, now())
    where person_id = p_person_id and account_id = p_account_id;
  delete from public.activity where person_id = p_person_id;
  delete from public.strikes  where person_id = p_person_id;
  update public.people
    set display_name = '[deleted]', avatar = '', pin_hash = null, deleted_at = now()
    where id = p_person_id and account_id = p_account_id;
  insert into public.safety_audit (account_id, target_person_id, action)
  values (p_account_id, p_person_id, 'child_data_deleted');
end $$;

-- ---- C4: Raw Content Layer (posts, comments, media) ----
create table if not exists public.posts (
  id               uuid primary key default gen_random_uuid(),
  community_id     text not null,
  account_id       uuid not null references public.accounts(id) on delete cascade,
  author_person_id uuid not null references public.people(id) on delete cascade,
  body             text not null,
  status           text not null default 'visible' check (status in ('visible','hidden')),
  created_at       timestamptz not null default now()
);
create index if not exists posts_community_created_idx on public.posts (community_id, created_at desc);
create index if not exists posts_author_idx on public.posts (author_person_id);
alter table public.posts enable row level security;

create table if not exists public.comments (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references public.posts(id) on delete cascade,
  account_id       uuid not null references public.accounts(id) on delete cascade,
  author_person_id uuid not null references public.people(id) on delete cascade,
  body             text not null,
  status           text not null default 'visible' check (status in ('visible','hidden')),
  created_at       timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at);
alter table public.comments enable row level security;

create table if not exists public.media (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.accounts(id) on delete cascade,
  owner_person_id uuid not null references public.people(id) on delete cascade,
  post_id         uuid references public.posts(id) on delete set null,
  bucket          text not null default 'media',
  path            text not null,
  mime            text,
  bytes           bigint,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  is_minor        boolean not null default false,
  scan_provider   text,
  scan_verdict    text check (scan_verdict in ('clean','csam','review')),
  scanned_at      timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists media_status_idx on public.media (account_id, status);
alter table public.media enable row level security;

-- SAFE-2: abuse incidents (immutable) + NCMEC reports (legal retention)
create table if not exists public.incidents (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete set null,
  person_id  uuid references public.people(id) on delete set null,
  kind       text not null,
  media_id   uuid references public.media(id) on delete set null,
  ref        text,
  detail     jsonb not null default '{}'::jsonb,
  status     text not null default 'open' check (status in ('open','preserved','closed')),
  created_at timestamptz not null default now()
);
create index if not exists incidents_account_idx on public.incidents (account_id, created_at desc);
alter table public.incidents enable row level security;

create table if not exists public.ncmec_reports (
  id          uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','filed','failed')),
  report_ref  text,
  filed_at    timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists ncmec_reports_status_idx on public.ncmec_reports (status);
alter table public.ncmec_reports enable row level security;

create or replace function public.can_author(p_account_id uuid, p_person_id uuid)
returns boolean language sql security definer set search_path = public, extensions as $$
  select exists(
    select 1 from public.people p
    where p.id = p_person_id and p.account_id = p_account_id and p.deleted_at is null
      and (p.kind = 'adult'
           or exists(select 1 from public.consents c where c.person_id = p.id and c.revoked_at is null))
  );
$$;

create or replace function public.create_post(
  p_account_id uuid, p_author_person_id uuid, p_community_id text, p_body text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
  if not public.can_author(p_account_id, p_author_person_id) then
    raise exception 'author not permitted (not in account, deleted, or child without active consent)';
  end if;
  insert into public.posts (community_id, account_id, author_person_id, body)
  values (p_community_id, p_account_id, p_author_person_id, p_body) returning id into new_id;
  return new_id;
end $$;

create or replace function public.list_posts(p_community_id text, p_limit int)
returns table(id uuid, body text, created_at timestamptz, author_person_id uuid, author_name text, author_avatar text)
language sql security definer set search_path = public, extensions as $$
  select po.id, po.body, po.created_at, po.author_person_id, pe.display_name, pe.avatar
  from public.posts po join public.people pe on pe.id = po.author_person_id
  where po.community_id = p_community_id and po.status = 'visible'
  order by po.created_at desc
  limit greatest(1, least(coalesce(p_limit,50), 200));
$$;

create or replace function public.add_comment(
  p_account_id uuid, p_author_person_id uuid, p_post_id uuid, p_body text)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
  if not public.can_author(p_account_id, p_author_person_id) then raise exception 'author not permitted'; end if;
  insert into public.comments (post_id, account_id, author_person_id, body)
  values (p_post_id, p_account_id, p_author_person_id, p_body) returning id into new_id;
  return new_id;
end $$;

create or replace function public.list_comments(p_post_id uuid, p_limit int)
returns table(id uuid, body text, created_at timestamptz, author_name text, author_avatar text)
language sql security definer set search_path = public, extensions as $$
  select c.id, c.body, c.created_at, pe.display_name, pe.avatar
  from public.comments c join public.people pe on pe.id = c.author_person_id
  where c.post_id = p_post_id and c.status = 'visible'
  order by c.created_at asc
  limit greatest(1, least(coalesce(p_limit,100), 500));
$$;

create or replace function public.create_media(
  p_account_id uuid, p_owner_person_id uuid, p_post_id uuid, p_path text,
  p_mime text, p_bytes bigint, p_is_minor boolean)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
  if not public.can_author(p_account_id, p_owner_person_id) then raise exception 'uploader not permitted'; end if;
  insert into public.media (account_id, owner_person_id, post_id, path, mime, bytes, is_minor)
  values (p_account_id, p_owner_person_id, p_post_id, p_path, p_mime, p_bytes, p_is_minor) returning id into new_id;
  return new_id;
end $$;

create or replace function public.set_media_status(p_account_id uuid, p_media_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_status not in ('pending','approved','rejected') then raise exception 'bad status'; end if;
  update public.media set status = p_status where id = p_media_id and account_id = p_account_id;
end $$;

create or replace function public.list_pending_media(p_account_id uuid)
returns table(id uuid, owner_person_id uuid, path text, mime text, is_minor boolean, created_at timestamptz)
language sql security definer set search_path = public, extensions as $$
  select id, owner_person_id, path, mime, is_minor, created_at from public.media
  where account_id = p_account_id and status = 'pending' order by created_at asc;
$$;

create or replace function public.hide_post(p_account_id uuid, p_post_id uuid)
returns void language sql security definer set search_path = public, extensions as $$
  update public.posts set status='hidden' where id=p_post_id and account_id=p_account_id;
$$;

create or replace function public.hide_comment(p_account_id uuid, p_comment_id uuid)
returns void language sql security definer set search_path = public, extensions as $$
  update public.comments set status='hidden' where id=p_comment_id and account_id=p_account_id;
$$;

-- ---- SAFE-2 abuse-detection & reporting RPCs ----
create or replace function public.create_incident(
  p_account_id uuid, p_person_id uuid, p_kind text, p_media_id uuid, p_ref text, p_detail jsonb)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare i uuid;
begin
  insert into public.incidents (account_id, person_id, kind, media_id, ref, detail, status)
  values (p_account_id, p_person_id, p_kind, p_media_id, p_ref, coalesce(p_detail,'{}'::jsonb), 'preserved')
  returning id into i;
  insert into public.safety_audit (account_id, target_person_id, action, detail)
  values (p_account_id, p_person_id, 'incident_created', jsonb_build_object('kind',p_kind,'incident',i));
  return i;
end $$;

create or replace function public.create_ncmec_report(p_incident_id uuid)
returns uuid language sql security definer set search_path = public, extensions as $$
  insert into public.ncmec_reports (incident_id) values (p_incident_id) returning id;
$$;

create or replace function public.set_media_verdict(
  p_account_id uuid, p_media_id uuid, p_provider text, p_verdict text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare m_owner uuid; inc uuid;
begin
  if p_verdict not in ('clean','csam','review') then raise exception 'bad verdict'; end if;
  update public.media
    set scan_provider = p_provider, scan_verdict = p_verdict, scanned_at = now(),
        status = case p_verdict when 'clean' then 'approved' when 'csam' then 'rejected' else 'pending' end
    where id = p_media_id and account_id = p_account_id
    returning owner_person_id into m_owner;
  if p_verdict = 'csam' then
    inc := public.create_incident(p_account_id, m_owner, 'csam_suspected', p_media_id, null,
                                  jsonb_build_object('provider', p_provider));
    perform public.create_ncmec_report(inc);
  end if;
end $$;

create or replace function public.list_incidents(p_account_id uuid)
returns table(id uuid, kind text, status text, media_id uuid, created_at timestamptz)
language sql security definer set search_path = public, extensions as $$
  select id, kind, status, media_id, created_at from public.incidents
  where account_id = p_account_id order by created_at desc;
$$;

create or replace function public.list_open_ncmec_reports()
returns table(id uuid, incident_id uuid, created_at timestamptz)
language sql security definer set search_path = public, extensions as $$
  select id, incident_id, created_at from public.ncmec_reports where status = 'pending' order by created_at asc;
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

-- Grants AFTER the tables exist: `grant on all tables` only covers tables that
-- exist at execution time, so these must follow the CREATE TABLE statements
-- (otherwise the Auth.js adapter / Resend magic-link login breaks on first deploy).
grant all on all tables    in schema next_auth to service_role;
grant all on all sequences in schema next_auth to service_role;
grant all on all functions in schema next_auth to service_role;

-- C4 media: private Storage bucket (served only via signed URLs once approved)
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;
