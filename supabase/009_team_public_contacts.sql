alter table public.team_members
  add column if not exists linkedin_url text not null default '',
  add column if not exists public_email text not null default '',
  add column if not exists show_public_email boolean not null default false,
  add column if not exists photo_alt_en text not null default '',
  add column if not exists photo_alt_bn text not null default '';

drop policy if exists team_admin_update on public.team_members;
create policy team_admin_update on public.team_members
  for update using (public.is_admin()) with check (public.is_admin());

create or replace view public.team_members_public
with (security_invoker = true)
as
select
  id,
  group_type,
  name,
  title_en,
  title_bn,
  department,
  bio_en,
  bio_bn,
  photo_url,
  photo_alt_en,
  photo_alt_bn,
  links,
  linkedin_url,
  case when show_public_email then public_email else '' end as public_email,
  show_public_email,
  sort_order,
  is_published
from public.team_members
where group_type = 'team' and is_published = true;

grant select on public.team_members_public to anon, authenticated;

insert into public.site_settings (key, value) values
  ('team_title_en', '"Our Team"'),
  ('team_title_bn', '"আমাদের টিম"'),
  ('team_subtitle_en', '"The Minds Behind Shonjibon"'),
  ('team_subtitle_bn', '"সঞ্জীবনের পেছনের মানুষেরা"'),
  ('team_description_en', '"A small team on a big mission: turning waste into clean water with science, design, and care."'),
  ('team_description_bn', '"ছোট একটি দল, বড় একটি লক্ষ্য: বিজ্ঞান, নকশা ও যত্ন দিয়ে বর্জ্যকে বিশুদ্ধ পানিতে রূপ দেওয়া।"')
on conflict (key) do nothing;
