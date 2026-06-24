begin;
select plan(7);

insert into public.accounts (owner_email) values ('p@safe2.test');
insert into public.people (account_id, kind, is_owner, display_name, avatar)
  select id, 'adult', true, 'Mum', '🙂' from public.accounts where owner_email='p@safe2.test';
insert into public.media (account_id, owner_person_id, path)
  select a.id, p.id, 'media/x.png'
  from public.accounts a join public.people p on p.account_id = a.id
  where a.owner_email='p@safe2.test';

select has_table('public', 'incidents', 'incidents table exists');
select has_table('public', 'ncmec_reports', 'ncmec_reports table exists');
select has_column('public', 'media', 'scan_verdict', 'media.scan_verdict exists');

-- clean -> approved
select lives_ok(
  $$ select public.set_media_verdict(
       (select id from public.accounts where owner_email='p@safe2.test'),
       (select id from public.media limit 1), 'manual', 'clean') $$,
  'set_media_verdict clean runs');
select is(
  (select status from public.media limit 1),
  'approved', 'clean verdict -> media approved');

-- csam -> rejected + incident + queued NCMEC report
select lives_ok(
  $$ select public.set_media_verdict(
       (select id from public.accounts where owner_email='p@safe2.test'),
       (select id from public.media limit 1), 'manual', 'csam') $$,
  'set_media_verdict csam runs');
select ok(
  (select status from public.media limit 1) = 'rejected'
  and (select count(*) from public.incidents where kind='csam_suspected') = 1
  and (select count(*) from public.list_open_ncmec_reports()) = 1,
  'csam verdict -> media rejected + incident + NCMEC report queued');

select * from finish();
rollback;
