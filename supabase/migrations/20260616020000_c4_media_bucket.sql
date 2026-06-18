-- C4 media: private Storage bucket (served only via signed URLs once approved)
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;
-- No anon storage policies: the server uses the service-role client (signed URLs),
-- which bypasses storage RLS. Keep the bucket private.
