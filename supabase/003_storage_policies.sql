-- Keep the public media bucket read-only to visitors and restrict mutations to admins.
update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ]
where id = 'media';

drop policy if exists media_admin_update on public.media;
create policy media_admin_update on public.media
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media bucket public read" on storage.objects;
drop policy if exists "media bucket admin write" on storage.objects;
drop policy if exists "media bucket admin update" on storage.objects;
drop policy if exists "media bucket admin delete" on storage.objects;
drop policy if exists media_bucket_public_read on storage.objects;
drop policy if exists media_bucket_admin_insert on storage.objects;
drop policy if exists media_bucket_admin_update on storage.objects;
drop policy if exists media_bucket_admin_delete on storage.objects;

create policy media_bucket_public_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_bucket_admin_insert on storage.objects
  for insert with check (
    bucket_id = 'media'
    and public.is_admin()
    and octet_length(name) > 0
  );

create policy media_bucket_admin_update on storage.objects
  for update using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy media_bucket_admin_delete on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());
