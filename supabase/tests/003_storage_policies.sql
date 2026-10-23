-- Run with `supabase test db` after applying migrations 001 and 003.
do $$
declare
  v_policy_count integer;
  v_limit bigint;
  v_types text[];
  v_read_qual text;
  v_insert_check text;
  v_update_qual text;
  v_update_check text;
  v_delete_qual text;
  v_media_update_qual text;
  v_media_update_check text;
begin
  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname in (
      'media_bucket_public_read',
      'media_bucket_admin_insert',
      'media_bucket_admin_update',
      'media_bucket_admin_delete'
    );

  if v_policy_count <> 4 then
    raise exception 'Expected four media storage policies, found %', v_policy_count;
  end if;

  select qual into v_read_qual from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'media_bucket_public_read';
  select with_check into v_insert_check from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'media_bucket_admin_insert';
  select qual, with_check into v_update_qual, v_update_check from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'media_bucket_admin_update';
  select qual into v_delete_qual from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'media_bucket_admin_delete';

  if v_read_qual is null or v_read_qual not like '%bucket_id%' then
    raise exception 'Public read policy is not restricted to the media bucket';
  end if;
  if v_insert_check is null or v_insert_check not like '%is_admin%' or v_insert_check not like '%bucket_id%' then
    raise exception 'Storage insert policy does not require admin access and the media bucket';
  end if;
  if v_update_qual is null or v_update_check is null
    or v_update_qual not like '%is_admin%' or v_update_check not like '%is_admin%' then
    raise exception 'Storage update policy does not require admin access';
  end if;
  if v_delete_qual is null or v_delete_qual not like '%is_admin%' or v_delete_qual not like '%bucket_id%' then
    raise exception 'Storage delete policy does not require admin access and the media bucket';
  end if;

  select qual, with_check into v_media_update_qual, v_media_update_check
  from pg_policies
  where schemaname = 'public' and tablename = 'media' and policyname = 'media_admin_update';
  if v_media_update_qual is null or v_media_update_check is null
    or v_media_update_qual not like '%is_admin%' or v_media_update_check not like '%is_admin%' then
    raise exception 'Media metadata update policy does not require admin access';
  end if;

  select file_size_limit, allowed_mime_types into v_limit, v_types
  from storage.buckets
  where id = 'media';

  if v_limit is distinct from 5242880 then
    raise exception 'Expected 5 MiB media limit, found %', v_limit;
  end if;
  if v_types is null or not ('image/jpeg' = any(v_types) and 'image/png' = any(v_types)
    and 'image/webp' = any(v_types) and 'application/pdf' = any(v_types)) then
    raise exception 'Media bucket MIME allowlist is incomplete';
  end if;
end;
$$;
