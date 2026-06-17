begin;
select plan(10);

-- setup: account + adult owner + child (no consent yet)
insert into public.accounts (owner_email) values ('p@c4.test');
insert into public.people (account_id, kind, is_owner, display_name, avatar)
  select id, 'adult', true, 'Mum', '🙂' from public.accounts where owner_email='p@c4.test';
insert into public.people (account_id, kind, is_owner, display_name, avatar, age_band)
  select id, 'child', false, 'Kid', '🧒', 'under_13' from public.accounts where owner_email='p@c4.test';

select has_table('public', 'posts', 'posts table exists');
select has_table('public', 'media', 'media table exists');

-- adult can post; list_posts returns author name
select lives_ok(
  $$ select public.create_post(
       (select id from public.accounts where owner_email='p@c4.test'),
       (select id from public.people where display_name='Mum'),
       'bible-explorers', 'Hello world') $$,
  'adult create_post runs');
select is(
  (select author_name from public.list_posts('bible-explorers', 50) limit 1),
  'Mum', 'list_posts returns author display name');

-- a child WITHOUT active consent cannot author
select throws_ok(
  $$ select public.create_post(
       (select id from public.accounts where owner_email='p@c4.test'),
       (select id from public.people where display_name='Kid'),
       'bible-explorers', 'hi') $$,
  null, null, 'child without consent cannot post');

-- grant consent -> child can author
insert into public.consents (account_id, person_id, scope, method, notice_version)
  select (select id from public.accounts where owner_email='p@c4.test'),
         id, 'service_v1', 'parent_attestation_v1', '2026-06-16'
  from public.people where display_name='Kid';
select lives_ok(
  $$ select public.create_post(
       (select id from public.accounts where owner_email='p@c4.test'),
       (select id from public.people where display_name='Kid'),
       'bible-explorers', 'my first post') $$,
  'consent-active child can post');
select is(
  (select count(*)::int from public.list_posts('bible-explorers', 50)),
  2, 'feed lists both posts');

-- comment
select lives_ok(
  $$ select public.add_comment(
       (select id from public.accounts where owner_email='p@c4.test'),
       (select id from public.people where display_name='Mum'),
       (select id from public.posts where body='Hello world'),
       'nice') $$,
  'add_comment runs');

-- media: pending -> approved
select is(
  (select count(*)::int from public.list_pending_media(
     (select id from public.accounts where owner_email='p@c4.test'))),
  0, 'no pending media initially');
select ok(
  ( with m as (
      select public.create_media(
        (select id from public.accounts where owner_email='p@c4.test'),
        (select id from public.people where display_name='Kid'),
        null, 'media/kid/x.png', 'image/png', 1234, true) as id)
    select public.set_media_status(
        (select id from public.accounts where owner_email='p@c4.test'),
        (select id from m), 'approved') is null ),
  'create_media (pending) then set_media_status approved runs');

select * from finish();
rollback;
