delete from public.site_settings
where key = 'admin_password';

update public.site_settings
set value = '""'::jsonb
where key = 'contact_email'
  and value = '"usamabenmahmud@gmail.com"'::jsonb;

update public.site_settings
set value = jsonb_set(value, '{email}', '""'::jsonb, true)
where key = 'contact'
  and value->>'email' = 'usamabenmahmud@gmail.com';
