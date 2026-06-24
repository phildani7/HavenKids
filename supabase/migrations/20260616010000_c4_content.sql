-- C4 — Raw Content Layer (posts, comments, media)
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
  created_at      timestamptz not null default now()
);
create index if not exists media_status_idx on public.media (account_id, status);
alter table public.media enable row level security;

-- author must be in the account, not soft-deleted, and (if a child) consent-active (SAFE-1)
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

-- account-scoped moderation: a guardian reviews their own household's pending media.
-- platform-wide moderation arrives with F2 roles + SAFE-2.
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

-- new functions need EXECUTE locked to service_role (prior grant predates them)
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;
