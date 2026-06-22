begin;
select plan(16);

-- ---- seed: one account, an owner adult + a second adult + two teens + one under-13 ----
insert into public.accounts (id, owner_email) values
  ('11111111-1111-1111-1111-111111111111', 'p@safe3.test');
insert into public.people (id, account_id, kind, is_owner, display_name, avatar, age_band) values
  ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','adult',true,'Parent','x','adult'),
  ('33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','adult',false,'Adult2','x','adult'),
  ('44444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','child',false,'KidA','x','13_17'),
  ('55555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','child',false,'KidB','x','13_17'),
  ('66666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111','child',false,'KidU','x','under_13');

select has_table('public','connections','connections table exists');
select has_table('public','dms','dms (monitored message store) exists');
select has_column('public','dms','involves_minor','dms.involves_minor exists');

-- ---- adult <-> adult: activates on accept ----
create temp table cc(name text primary key, id uuid);
insert into cc select 'aa', public.request_connection(
  '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');
select public.respond_connection('11111111-1111-1111-1111-111111111111',(select id from cc where name='aa'), true);
select is((select status from public.connections where id=(select id from cc where name='aa')),
          'active', 'adult<->adult connection active after accept');

-- ---- kid <-> kid: two-parent rule (R12) ----
insert into cc select 'kk', public.request_connection(
  '11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555');
select public.respond_connection('11111111-1111-1111-1111-111111111111',(select id from cc where name='kk'), true);
select is((select status from public.connections where id=(select id from cc where name='kk')),
          'pending', 'kid<->kid stays pending before parent approvals');
select public.set_connection_parent_ok('11111111-1111-1111-1111-111111111111',(select id from cc where name='kk'),'44444444-4444-4444-4444-444444444444');
select is((select status from public.connections where id=(select id from cc where name='kk')),
          'pending', 'still pending after only one parent approval');
select public.set_connection_parent_ok('11111111-1111-1111-1111-111111111111',(select id from cc where name='kk'),'55555555-5555-5555-5555-555555555555');
select is((select status from public.connections where id=(select id from cc where name='kk')),
          'active', 'active only after BOTH parents approve (R12)');

-- ---- can_dm gate ----
select ok((select allowed from public.can_dm('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333')),
          'can_dm true for active adult connection');
select ok((select allowed from public.can_dm('44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555')),
          'can_dm true for active teen<->teen connection');
select is((select reason from public.can_dm('44444444-4444-4444-4444-444444444444','66666666-6666-6666-6666-666666666666')),
          'under13_no_dm', 'can_dm denies any under-13 party (D1)');

-- ---- send_message: gate blocks with no row written ----
select is((select blocked from public.send_message(
            '11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','55555555-5555-5555-5555-555555555555','hi',false,null)),
          true, 'send_message blocked when no active connection');
select is((select count(*)::int from public.dms
            where sender_id='22222222-2222-2222-2222-222222222222' and recipient_id='55555555-5555-5555-5555-555555555555'),
          0, 'no message row written for a blocked send');

-- ---- flagged DM -> strike + abuse_dm incident; involves_minor derived ----
select public.send_message('11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','55555555-5555-5555-5555-555555555555','hi friend',false,null);
select is((select involves_minor from public.dms where sender_id='44444444-4444-4444-4444-444444444444' limit 1),
          true, 'kid message marked involves_minor');
select public.send_message('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333','you dumb',true,'dumb');
select is((select public.active_strikes('22222222-2222-2222-2222-222222222222')), 1, 'flagged DM adds a strike to sender');
select is((select count(*)::int from public.incidents where kind='abuse_dm'), 1, 'flagged DM opens an abuse_dm incident');

-- ---- parent monitoring + grooming-risk escalation ----
select ok((select count(*) >= 1 from public.list_child_messages(
            '11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444')),
          'parent monitoring lists the child''s messages');
select public.flag_contact_risk('11111111-1111-1111-1111-111111111111','44444444-4444-4444-4444-444444444444','grooming_suspected', null, '{}'::jsonb);
select is((select count(*)::int from public.incidents where kind='grooming_suspected'), 1,
          'flag_contact_risk opens a grooming_suspected incident');

select * from finish();
rollback;
