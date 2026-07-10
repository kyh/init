-- Runs on `supabase start` (first boot) and `supabase db reset`.
--
-- Storage policies for the avatars bucket. The app authenticates with
-- better-auth (not Supabase Auth), so browser uploads run as the `anon`
-- role and cannot be scoped per-user here. This is acceptable for a
-- public avatar bucket in a starter; if you need real ownership checks,
-- proxy uploads through a server route using the service-role key.

create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert" on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "avatars_update" on storage.objects
  for update using (bucket_id = 'avatars');

create policy "avatars_delete" on storage.objects
  for delete using (bucket_id = 'avatars');
