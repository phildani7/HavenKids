-- SAFE-3 — Contact & DM safety. Gates S1 (connections/favourites/DMs).
-- Builds the GOVERNED stores + decision functions: connection approval (two-parent
-- rule, R12), the can_dm gate (under-13 off by default), the guarded send_message
-- write path (moderation -> strike + incident), parent monitoring, and block/report.
-- S1 builds realtime + UI on top by calling these rails. ML grooming classifier = seam.

-- ---- Connections (the contact relationship + approval state machine) ----
create table if not exists public.connections (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid references public.accounts(id) on delete set null, -- requester's account (scoping)
  requester_id        uuid not null references public.people(id) on delete cascade,
  addressee_id        uuid not null references public.people(id) on delete cascade,
  status              text not null default 'pending'
                        check (status in ('pending','active','declined','blocked')),
  requester_parent_ok boolean not null default false, -- required only if requester is a child
  addressee_parent_ok boolean not null default false, -- required only if addressee is a child
  addressee_accepted  boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint connections_distinct check (requester_id <> addressee_id)
);
-- one connection per unordered pair (prevents A->B and B->A duplicates)
create unique index if not exists connections_pair_uniq
  on public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
alter table public.connections enable row level security;

-- ---- Messages (the MONITORED dm store; S1 adds realtime + UI) ----
create table if not exists public.dms (
  id            uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_id     uuid not null references public.people(id) on delete cascade,
  recipient_id  uuid not null references public.people(id) on delete cascade,
  body          text not null,
  flagged       boolean not null default false,
  flagged_term  text,
  involves_minor boolean not null,
  created_at    timestamptz not null default now()
);
create index if not exists dms_conn_idx on public.dms (connection_id, created_at);
alter table public.dms enable row level security;

-- ---- internal: flip a connection to active once all conditions are met ----
-- parent_ok columns are preset true for adult sides at creation, so this check is uniform.
create or replace function public.activate_connection_if_ready(p_conn uuid)
returns void language sql security definer set search_path = public, extensions as $$
  update public.connections
     set status = 'active', updated_at = now()
   where id = p_conn
     and status = 'pending'
     and addressee_accepted = true
     and requester_parent_ok = true
     and addressee_parent_ok = true;
$$;

-- ---- request a connection ----
-- Adult sides get parent_ok = true automatically; child sides start false (need a parent).
create or replace function public.request_connection(
  p_account_id uuid, p_requester uuid, p_addressee uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare existing record; req_child boolean; addr_child boolean; new_id uuid;
begin
  if p_requester = p_addressee then raise exception 'cannot connect to self'; end if;
  select * into existing from public.connections
    where least(requester_id,addressee_id) = least(p_requester,p_addressee)
      and greatest(requester_id,addressee_id) = greatest(p_requester,p_addressee);
  if found then
    if existing.status = 'blocked' then raise exception 'blocked'; end if;
    return existing.id; -- already requested/active; idempotent
  end if;
  select (kind = 'child') into req_child  from public.people where id = p_requester;
  select (kind = 'child') into addr_child from public.people where id = p_addressee;
  insert into public.connections (account_id, requester_id, addressee_id,
                                  requester_parent_ok, addressee_parent_ok)
  values (p_account_id, p_requester, p_addressee, not req_child, not addr_child)
  returning id into new_id;
  return new_id;
end $$;

-- ---- parent approves a connection on behalf of THEIR OWN child (R12) ----
create or replace function public.set_connection_parent_ok(
  p_account_id uuid, p_connection_id uuid, p_child_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare conn record;
begin
  -- ownership: the child must belong to this account
  if not exists (select 1 from public.people
                 where id = p_child_id and account_id = p_account_id and kind = 'child') then
    raise exception 'not your child';
  end if;
  select * into conn from public.connections where id = p_connection_id;
  if not found then raise exception 'no such connection'; end if;
  if conn.status = 'blocked' then raise exception 'blocked'; end if;
  if conn.requester_id = p_child_id then
    update public.connections set requester_parent_ok = true, updated_at = now() where id = p_connection_id;
  elsif conn.addressee_id = p_child_id then
    update public.connections set addressee_parent_ok = true, updated_at = now() where id = p_connection_id;
  else
    raise exception 'child not part of this connection';
  end if;
  perform public.activate_connection_if_ready(p_connection_id);
  insert into public.safety_audit (account_id, target_person_id, action, detail)
  values (p_account_id, p_child_id, 'connection_parent_approved',
          jsonb_build_object('connection', p_connection_id));
end $$;

-- ---- addressee accepts/declines ----
create or replace function public.respond_connection(
  p_account_id uuid, p_connection_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare conn record;
begin
  select * into conn from public.connections where id = p_connection_id;
  if not found then raise exception 'no such connection'; end if;
  -- ownership: caller's account must own the addressee
  if not exists (select 1 from public.people
                 where id = conn.addressee_id and account_id = p_account_id) then
    raise exception 'not your connection to respond to';
  end if;
  if not p_accept then
    update public.connections set status = 'declined', updated_at = now() where id = p_connection_id;
    return;
  end if;
  update public.connections set addressee_accepted = true, updated_at = now() where id = p_connection_id;
  perform public.activate_connection_if_ready(p_connection_id);
end $$;

-- ---- block (overrides everything) ----
create or replace function public.block_connection(
  p_account_id uuid, p_connection_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.connections set status = 'blocked', updated_at = now() where id = p_connection_id;
  insert into public.safety_audit (account_id, target_person_id, action, detail)
  values (p_account_id, null, 'connection_blocked', jsonb_build_object('connection', p_connection_id));
end $$;

-- ---- the DM permission gate ----
-- allowed only if: an ACTIVE connection exists, no under-13 party (D1), not blocked.
create or replace function public.can_dm(p_a uuid, p_b uuid)
returns table(allowed boolean, reason text)
language plpgsql security definer set search_path = public, extensions as $$
declare conn record; a_u13 boolean; b_u13 boolean;
begin
  select (age_band = 'under_13') into a_u13 from public.people where id = p_a;
  select (age_band = 'under_13') into b_u13 from public.people where id = p_b;
  if coalesce(a_u13,false) or coalesce(b_u13,false) then
    return query select false, 'under13_no_dm'; return;
  end if;
  select * into conn from public.connections
    where least(requester_id,addressee_id) = least(p_a,p_b)
      and greatest(requester_id,addressee_id) = greatest(p_a,p_b);
  if not found then return query select false, 'no_connection'; return; end if;
  if conn.status = 'blocked' then return query select false, 'blocked'; return; end if;
  if conn.status <> 'active' then return query select false, 'not_active'; return; end if;
  return query select true, 'ok';
end $$;

-- ---- the guarded send path ----
-- App computes moderateText (blocklist lives in TS) and passes p_flagged/p_term.
-- On flag: strike the sender + open an immutable abuse_dm incident (R10). Atomic.
create or replace function public.send_message(
  p_account_id uuid, p_sender uuid, p_recipient uuid, p_body text,
  p_flagged boolean default false, p_term text default null)
returns table(message_id uuid, flagged boolean, blocked boolean, reason text)
language plpgsql security definer set search_path = public, extensions as $$
declare gate record; conn_id uuid; minor boolean; mid uuid;
begin
  select * into gate from public.can_dm(p_sender, p_recipient);
  if not gate.allowed then
    return query select null::uuid, false, true, gate.reason; return;
  end if;
  select id into conn_id from public.connections
    where least(requester_id,addressee_id) = least(p_sender,p_recipient)
      and greatest(requester_id,addressee_id) = greatest(p_sender,p_recipient);
  select (exists (select 1 from public.people
                  where id in (p_sender,p_recipient) and kind = 'child')) into minor;
  insert into public.dms (connection_id, sender_id, recipient_id, body,
                               flagged, flagged_term, involves_minor)
  values (conn_id, p_sender, p_recipient, p_body, coalesce(p_flagged,false), p_term, minor)
  returning id into mid;
  if coalesce(p_flagged,false) then
    perform public.add_strike(p_sender, 'dm:' || coalesce(p_term,'flagged'));
    perform public.create_incident(p_account_id, p_sender, 'abuse_dm', null, mid::text,
                                   jsonb_build_object('term', p_term));
  end if;
  return query select mid, coalesce(p_flagged,false), false, 'ok';
end $$;

-- ---- parent monitoring (ownership-checked; admin-unlock enforced in the app) ----
create or replace function public.list_child_connections(p_account_id uuid, p_child uuid)
returns table(id uuid, other_person uuid, status text, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.people
                 where people.id = p_child and account_id = p_account_id) then
    raise exception 'not your child';
  end if;
  return query
    select c.id,
           case when c.requester_id = p_child then c.addressee_id else c.requester_id end,
           c.status, c.created_at
    from public.connections c
    where c.requester_id = p_child or c.addressee_id = p_child
    order by c.created_at desc;
end $$;

create or replace function public.list_child_messages(p_account_id uuid, p_child uuid)
returns table(id uuid, connection_id uuid, sender_id uuid, recipient_id uuid,
              body text, flagged boolean, created_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.people
                 where people.id = p_child and account_id = p_account_id) then
    raise exception 'not your child';
  end if;
  return query
    select m.id, m.connection_id, m.sender_id, m.recipient_id, m.body, m.flagged, m.created_at
    from public.dms m
    where m.sender_id = p_child or m.recipient_id = p_child
    order by m.created_at desc;
end $$;

-- ---- user-initiated reports -> incident ----
create or replace function public.report_user(
  p_account_id uuid, p_reporter uuid, p_target uuid, p_detail jsonb)
returns uuid language sql security definer set search_path = public, extensions as $$
  select public.create_incident(p_account_id, p_reporter, 'report_user', null,
                                p_target::text, coalesce(p_detail,'{}'::jsonb));
$$;

create or replace function public.report_message(
  p_account_id uuid, p_reporter uuid, p_message_id uuid, p_detail jsonb)
returns uuid language sql security definer set search_path = public, extensions as $$
  select public.create_incident(p_account_id, p_reporter, 'report_message', null,
                                p_message_id::text, coalesce(p_detail,'{}'::jsonb));
$$;

-- ---- automated contact-risk escalation (grooming detection seam) ----
-- The app's ContactRiskProvider (heuristic now; ML later) calls this when a
-- connection/message scores 'review' or 'block'. Opens an immutable incident
-- (e.g. 'grooming_suspected') for parent + T&S follow-up. Does not auto-block contact.
create or replace function public.flag_contact_risk(
  p_account_id uuid, p_person_id uuid, p_kind text, p_ref text, p_detail jsonb)
returns uuid language sql security definer set search_path = public, extensions as $$
  select public.create_incident(p_account_id, p_person_id, p_kind, null,
                                p_ref, coalesce(p_detail,'{}'::jsonb));
$$;

-- ---- lock down RPC execution (service-role only; see F1 migration rationale) ----
revoke execute on all functions in schema public from public, anon, authenticated;
grant  execute on all functions in schema public to service_role;
