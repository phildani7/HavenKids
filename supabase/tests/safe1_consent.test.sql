begin;
select plan(15);

-- setup
select public.create_account('p@safe1.test');
select public.set_admin_pin((select id from public.accounts where owner_email='p@safe1.test'), '1234');
select public.create_profile(
  (select id from public.accounts where owner_email='p@safe1.test'),
  'child', 'Kid', '🧒', '9999', 'under_13');

-- age_band column + values
select has_column('public', 'people', 'age_band', 'people.age_band exists');
select is(
  (select age_band from public.people where display_name='Kid'),
  'under_13', 'child carries its age_band');
select is(
  (select age_band from public.people where account_id=(select id from public.accounts where owner_email='p@safe1.test') and is_owner),
  'adult', 'owner profile is adult');

-- inactive until consent
select ok(
  not public.child_is_active((select id from public.people where display_name='Kid')),
  'child inactive before consent');
select ok(
  not (select is_active from public.list_profiles((select id from public.accounts where owner_email='p@safe1.test'))
       where kind='child'),
  'list_profiles shows child inactive pre-consent');

-- record consent
select lives_ok(
  $$ select public.record_consent(
       (select id from public.accounts where owner_email='p@safe1.test'),
       (select id from public.people where display_name='Kid'),
       'service_v1', 'parent_attestation_v1', '2026-06-16', 'IN') $$,
  'record_consent runs');
select ok(
  public.child_is_active((select id from public.people where display_name='Kid')),
  'child active after consent');
select ok(
  (select is_active from public.list_profiles((select id from public.accounts where owner_email='p@safe1.test'))
   where kind='child'),
  'list_profiles shows child active post-consent');

-- consent cannot be recorded for a non-child (the owner adult)
select throws_ok(
  $$ select public.record_consent(
       (select id from public.accounts where owner_email='p@safe1.test'),
       (select id from public.people where account_id=(select id from public.accounts where owner_email='p@safe1.test') and is_owner),
       's','m','v', null) $$,
  null, null, 'consent on a non-child is rejected');

-- export contains no pin_hash
select ok(
  not ((public.export_child_data(
          (select id from public.accounts where owner_email='p@safe1.test'),
          (select id from public.people where display_name='Kid')) -> 'profile') ? 'pin_hash'),
  'export_child_data omits pin_hash');

-- seed activity + strike, then delete
insert into public.activity (person_id, event)
  select id, 'view_page' from public.people where display_name='Kid';
insert into public.strikes (person_id, reason)
  select id, 'x' from public.people where display_name='Kid';
select lives_ok(
  $$ select public.delete_child_data(
       (select id from public.accounts where owner_email='p@safe1.test'),
       (select id from public.people where display_name='Kid')) $$,
  'delete_child_data runs');

-- after delete: activity + strikes erased, consent proof retained, profile soft-deleted + delisted
select is(
  (select count(*)::int from public.activity a
     join public.people p on p.id=a.person_id
    where p.account_id=(select id from public.accounts where owner_email='p@safe1.test') and p.kind='child'),
  0, 'child activity erased');
select ok(
  (select count(*) from public.consents c
     join public.people p on p.id=c.person_id
    where p.kind='child') > 0,
  'consent proof retained after delete');
select ok(
  (select deleted_at from public.people
    where account_id=(select id from public.accounts where owner_email='p@safe1.test') and kind='child') is not null,
  'child profile soft-deleted');
select ok(
  not exists(select 1 from public.list_profiles((select id from public.accounts where owner_email='p@safe1.test')) where kind='child'),
  'soft-deleted child not listed');

select * from finish();
rollback;
