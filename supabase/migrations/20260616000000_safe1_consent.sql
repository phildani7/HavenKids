-- SAFE-1 — consent & parental controls
alter table public.people add column if not exists age_band text
  check (age_band in ('under_13','13_17','adult')) default 'adult';
update public.people set age_band = 'adult' where age_band is null;
alter table public.people alter column age_band set not null;
-- soft-delete marker: we scrub PII but keep the row so consent proof (R14) stays linked
alter table public.people add column if not exists deleted_at timestamptz;

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

-- Soft-delete: erase the child's PII + activity/strikes, but KEEP an anonymized
-- people row so the (revoked) consent records stay linked as proof (R14). A hard
-- delete would cascade-delete consents via the FK and destroy that proof.
create or replace function public.delete_child_data(p_account_id uuid, p_person_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists(select 1 from public.people
                where id = p_person_id and account_id = p_account_id and kind = 'child') then
    raise exception 'person is not a child of this account';
  end if;
  update public.consents set revoked_at = coalesce(revoked_at, now())
    where person_id = p_person_id and account_id = p_account_id;   -- revoke; retain proof
  delete from public.activity where person_id = p_person_id;
  delete from public.strikes  where person_id = p_person_id;
  update public.people
    set display_name = '[deleted]', avatar = '', pin_hash = null, deleted_at = now()
    where id = p_person_id and account_id = p_account_id;          -- scrub PII, keep row
  insert into public.safety_audit (account_id, target_person_id, action)
  values (p_account_id, p_person_id, 'child_data_deleted');
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
  from public.people p where p.account_id = p_account_id and p.deleted_at is null
  order by p.is_owner desc, p.created_at asc;
$$;

-- new functions need EXECUTE locked to service_role (F1's grant predates them)
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;
