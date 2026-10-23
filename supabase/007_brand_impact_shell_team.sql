alter table public.nav_items add column if not exists description_en text not null default '';
alter table public.nav_items add column if not exists description_bn text not null default '';
alter table public.nav_items add column if not exists icon text not null default '';

alter table public.page_sections drop constraint if exists page_sections_page_key_check;
alter table public.page_sections add constraint page_sections_page_key_check
  check (page_key in ('coastal', 'concerns', 'health', 'terms', 'privacy', 'refund', 'shipping'));

alter table public.impact_stats add column if not exists status text not null default 'sample'
  check (status in ('sample', 'target', 'verified'));
alter table public.impact_stats add column if not exists icon text not null default '';
alter table public.impact_stats add column if not exists description_en text not null default '';
alter table public.impact_stats add column if not exists description_bn text not null default '';
alter table public.impact_stats add column if not exists link text not null default '';
alter table public.impact_stats add column if not exists size text not null default 'S'
  check (size in ('S', 'M', 'L'));
alter table public.impact_stats add column if not exists is_featured boolean not null default false;
alter table public.impact_stats add column if not exists source_name text not null default '';
alter table public.impact_stats add column if not exists source_url text not null default '';

update public.impact_stats
set status = case when is_sample then 'sample' else 'target' end
where status = 'sample' and not is_sample;

drop policy if exists impact_stats_read on public.impact_stats;
create policy impact_stats_read on public.impact_stats for select
  using (is_published = true or public.is_admin());

delete from public.team_members where group_type <> 'team';
alter table public.team_members add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.team_members drop constraint if exists team_members_group_type_check;
alter table public.team_members add constraint team_members_group_type_check check (group_type = 'team');

create table if not exists public.shell_parts (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_en text not null,
  name_bn text not null,
  description_en text not null default '',
  description_bn text not null default '',
  icon text not null default '',
  color text not null default '',
  hotspot_x numeric(5,2) not null default 50 check (hotspot_x between 0 and 100),
  hotspot_y numeric(5,2) not null default 50 check (hotspot_y between 0 and 100),
  linked_product_ids uuid[] not null default '{}',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shell_parts enable row level security;
drop policy if exists shell_parts_public_read on public.shell_parts;
create policy shell_parts_public_read on public.shell_parts for select
  using (is_visible = true or public.is_admin());
drop policy if exists shell_parts_admin_write on public.shell_parts;
create policy shell_parts_admin_write on public.shell_parts for insert
  with check (public.is_admin());
drop policy if exists shell_parts_admin_update on public.shell_parts;
create policy shell_parts_admin_update on public.shell_parts for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists shell_parts_admin_delete on public.shell_parts;
create policy shell_parts_admin_delete on public.shell_parts for delete
  using (public.is_admin());

drop trigger if exists trg_shell_parts_updated on public.shell_parts;
create trigger trg_shell_parts_updated before update on public.shell_parts
  for each row execute function public.set_updated_at();
drop trigger if exists trg_audit_shell_parts on public.shell_parts;
create trigger trg_audit_shell_parts after insert or update or delete on public.shell_parts
  for each row execute function public.log_audit();

insert into public.site_settings(key, value) values
  ('branding', '{"name_bn":"সঞ্জীবন","name_en":"Shonjibon","show_bangla_name":true,"logo_mark_url":"","logo_full_url":"","logo_dark_url":"","logo_height":40,"use_mark_only":false}'::jsonb),
  ('contact', '{"phone":"01620485218","email":"usamabenmahmud@gmail.com","address":"Khulna, Bangladesh","hours":"","map_link":"","whatsapp_enabled":false}'::jsonb)
on conflict (key) do nothing;

insert into public.shell_parts(key, name_en, name_bn, description_en, description_bn, icon, color, hotspot_x, hotspot_y, sort_order) values
  ('carapace', 'Carapace', 'মাথার খোলস', 'The hard head shell contains chitin, minerals, and proteins.', 'শক্ত মাথার খোলসে কাইটিন, খনিজ ও প্রোটিন থাকে।', 'shell', 'coral', 29, 39, 1),
  ('abdomen', 'Abdomen plates', 'পেটের খোলস', 'The overlapping body plates are cleaned and prepared for processing.', 'একটির ওপর আরেকটি থাকা দেহের খোলস পরিষ্কার করে প্রক্রিয়ার জন্য প্রস্তুত করা হয়।', 'layers', 'coral', 60, 50, 2),
  ('tail', 'Tail fan', 'লেজের পাখা', 'The tail fan is another part of the shell material that can be reused.', 'লেজের পাখাও পুনর্ব্যবহারযোগ্য খোলসের অংশ।', 'reuse', 'teal', 83, 59, 3),
  ('layers', 'Shell layers', 'খোলসের স্তর', 'Shells contain a protein surface, chitin-protein fibers, and mineral material. Exact composition varies.', 'খোলসে প্রোটিনের উপরিভাগ, কাইটিন-প্রোটিন তন্তু ও খনিজ থাকে। সঠিক অনুপাত ভিন্ন হতে পারে।', 'layers', 'teal', 44, 75, 4)
on conflict (key) do nothing;

update public.nav_items set description_en = case label_en
  when 'All Products' then 'Browse every available product.'
  when 'Coastal Area Problem' then 'Water and environmental challenges in coastal Bangladesh.'
  when 'Our Concerning Issues' then 'Explore the issues our project addresses.'
  when 'Health And Disease Topics' then 'Read about water-related health concerns.'
  when 'Research' then 'Explore our methods and findings.'
  when 'The Shell Story' then 'See how shrimp shells become useful products.'
  when 'Lab Test Results' then 'Review available testing and verification.'
  when 'Our Journey' then 'Follow the project from idea to pilot.'
  when 'Picture Gallery' then 'View moments from the project and community.'
  when 'News And Awareness' then 'Read the latest news and awareness stories.'
  when 'About Us' then 'Learn about our mission and vision.'
  when 'Our Team' then 'Meet the six core teammates.'
  when 'FAQ' then 'Find answers to common questions.'
  else description_en end
where description_en = '';

update public.nav_items set description_bn = case label_en
  when 'All Products' then 'সব পণ্য দেখুন।'
  when 'Coastal Area Problem' then 'উপকূলীয় বাংলাদেশের পানি ও পরিবেশগত চ্যালেঞ্জ।'
  when 'Our Concerning Issues' then 'আমাদের প্রকল্পের লক্ষ্য বিষয়গুলো দেখুন।'
  when 'Health And Disease Topics' then 'পানিসংশ্লিষ্ট স্বাস্থ্যঝুঁকি জানুন।'
  when 'Research' then 'আমাদের পদ্ধতি ও ফলাফল দেখুন।'
  when 'The Shell Story' then 'চিংড়ির খোলস থেকে কীভাবে পণ্য তৈরি হয় দেখুন।'
  when 'Lab Test Results' then 'পরীক্ষা ও যাচাইয়ের তথ্য দেখুন।'
  when 'Our Journey' then 'ধারণা থেকে পাইলট পর্যন্ত যাত্রা দেখুন।'
  when 'Picture Gallery' then 'প্রকল্প ও কমিউনিটির মুহূর্ত দেখুন।'
  when 'News And Awareness' then 'সাম্প্রতিক সংবাদ ও সচেতনতামূলক লেখা পড়ুন।'
  when 'About Us' then 'আমাদের লক্ষ্য ও দৃষ্টিভঙ্গি জানুন।'
  when 'Our Team' then 'ছয়জন মূল সদস্যের সঙ্গে পরিচিত হন।'
  when 'FAQ' then 'সাধারণ প্রশ্নের উত্তর খুঁজুন।'
  else description_bn end
where description_bn = '';
