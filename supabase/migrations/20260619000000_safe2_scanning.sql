-- SAFE-2 — abuse detection & reporting pipeline.
-- Live scanner (PhotoDNA/Thorn/Cloudflare) + NCMEC filing = vendor/ESP onboarding ([LEGAL]/ops).
-- This builds the data model + RPC pipeline so those are a config swap. Default = manual review.

alter table public.media add column if not exists scan_provider text;
alter table public.media add column if not exists scan_verdict text
  check (scan_verdict in ('clean','csam','review'));
alter table public.media add column if not exists scanned_at timestamptz;

-- immutable abuse incidents
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

-- NCMEC CyberTipline reports (legal retention; never delete)
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

-- Apply a scan verdict: set media status, and on csam open an incident + queue an NCMEC report.
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

-- the NCMEC filing worklist (service-side; platform T&S use)
create or replace function public.list_open_ncmec_reports()
returns table(id uuid, incident_id uuid, created_at timestamptz)
language sql security definer set search_path = public, extensions as $$
  select id, incident_id, created_at from public.ncmec_reports where status = 'pending' order by created_at asc;
$$;

revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;
