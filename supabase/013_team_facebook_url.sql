alter table public.team_members
  add column if not exists facebook_url text not null default '';

update public.team_members as member
set
  title_en = details.title_en,
  title_bn = details.title_bn,
  department = details.department,
  bio_en = details.bio_en,
  bio_bn = details.bio_bn
from (values
  (
    'Usama Ben Mahmud',
    'Team Lead & Technology',
    'টিম লিড ও প্রযুক্তি',
    'Mathematics',
    'Coordinates the team, plans the work, and builds the website.',
    'দলকে সমন্বয় করেন, কাজের পরিকল্পনা করেন এবং ওয়েবসাইট তৈরি করেন।'
  ),
  (
    'Parboti Rani Sarkar',
    'Lead Researcher, Lab & Environment',
    'প্রধান গবেষক (ল্যাব ও পরিবেশ)',
    'Environmental Science',
    'An Environmental Science expert who leads chitosan extraction and filter testing.',
    'পরিবেশবিজ্ঞানের বিশেষজ্ঞ; কাইটোসান নিষ্কাশন ও ফিল্টার পরীক্ষার নেতৃত্ব দেন।'
  ),
  (
    'Anika Tabassum Akhy',
    'Communication & Lab Associate',
    'যোগাযোগ ও ল্যাব সহযোগী',
    'Communication',
    'Balances lab work with community engagement and external communications.',
    'ল্যাবের কাজের পাশাপাশি কমিউনিটির সঙ্গে সম্পৃক্ততা ও বাইরের যোগাযোগ সামলান।'
  ),
  (
    'Jannatul Mawoa Esha',
    'Finance & Budget Manager',
    'অর্থ ও বাজেট ব্যবস্থাপক',
    'Finance',
    'Handles the budget, costs, and financial planning.',
    'বাজেট, ব্যয় ও আর্থিক পরিকল্পনা পরিচালনা করেন।'
  ),
  (
    'Mrinmoy Mondal',
    'Marketing & Creative Lead',
    'মার্কেটিং ও ক্রিয়েটিভ লিড',
    'Marketing',
    'Creates graphics and leads branding and promotion.',
    'গ্রাফিকস তৈরি এবং ব্র্যান্ডিং ও প্রচারণার দায়িত্বে রয়েছেন।'
  ),
  (
    'Samia Islam Jim',
    'Food Safety & Quality Testing Lead',
    'খাদ্য নিরাপত্তা ও মান পরীক্ষা প্রধান',
    'Food Engineering',
    'With a Food Engineering background, she leads contamination and hazardous-substance testing, supporting the safety of our ShrimpSpice flour.',
    'খাদ্য প্রকৌশলের পটভূমি থেকে দূষণ ও বিপজ্জনক পদার্থের পরীক্ষা পরিচালনা করেন, যা আমাদের ShrimpSpice গুঁড়ার নিরাপত্তা নিশ্চিত করতেও সহায়তা করে।'
  )
) as details(name, title_en, title_bn, department, bio_en, bio_bn)
where member.name = details.name and member.group_type = 'team';

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
  is_published,
  facebook_url
from public.team_members
where group_type = 'team' and is_published = true;

grant select on public.team_members_public to anon, authenticated;
