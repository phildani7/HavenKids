begin;
select plan(24);

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

-- create_account makes account + owner profile
select lives_ok(
  $$ select public.create_account('owner@example.com') $$,
  'create_account runs');
select is(
  (select count(*)::int from public.people p
     join public.accounts a on a.id = p.account_id
    where a.owner_email='owner@example.com' and p.is_owner),
  1, 'create_account created one owner profile');

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

-- activity re-keyed to person_id
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

-- strikes
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

select * from finish();
rollback;
