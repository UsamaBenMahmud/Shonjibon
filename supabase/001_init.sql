-- ============================================================================
-- সঞ্জীবন (Shonjibon) — Supabase schema
-- Bilingual (*_en / *_bn) content, uuid ids, sort_order, timestamps + triggers,
-- row level security everywhere, audit log, and a public "media" storage bucket.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- profiles (linked 1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'editor' check (role in ('super_admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- site_settings (key/value jsonb store)
-- ---------------------------------------------------------------------------
create table site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger trg_settings_updated before update on site_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_bn text not null,
  tagline_en text not null default '',
  tagline_bn text not null default '',
  overview_en text not null default '',
  overview_bn text not null default '',
  trust_line_en text not null default '',
  trust_line_bn text not null default '',
  price numeric(10, 2) not null default 0,
  currency text not null default 'BDT',
  price_note_en text not null default '',
  price_note_bn text not null default '',
  stock_status text not null default 'in_stock'
    check (stock_status in ('in_stock', 'preorder', 'out_of_stock', 'coming_soon')),
  is_flagship boolean not null default false,
  is_published boolean not null default false,
  cover_image text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_en text not null default '',
  alt_bn text not null default '',
  sort_order int not null default 0
);

create table product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label_en text not null,
  label_bn text not null,
  value_en text not null default '',
  value_bn text not null default '',
  sort_order int not null default 0
);

create table product_benefits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  icon text not null default 'leaf',
  title_en text not null,
  title_bn text not null,
  body_en text not null default '',
  body_bn text not null default '',
  sort_order int not null default 0
);

-- process_steps.product_id is nullable = a global/shared process step
create table process_steps (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  step_no int not null default 1,
  title_en text not null,
  title_bn text not null,
  body_en text not null default '',
  body_bn text not null default '',
  icon text not null default 'flask',
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
create table article_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_bn text not null,
  sort_order int not null default 0
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references article_categories(id) on delete set null,
  title_en text not null,
  title_bn text not null,
  excerpt_en text not null default '',
  excerpt_bn text not null default '',
  body_en text not null default '',
  body_bn text not null default '',
  cover_image text not null default '',
  author text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  seo_title_en text not null default '',
  seo_title_bn text not null default '',
  seo_description_en text not null default '',
  seo_description_bn text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_articles_updated before update on articles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- journey / research / testing / impact
-- ---------------------------------------------------------------------------
create table journey_milestones (
  id uuid primary key default gen_random_uuid(),
  date_label_en text not null,
  date_label_bn text not null,
  title_en text not null,
  title_bn text not null,
  body_en text not null default '',
  body_bn text not null default '',
  image text not null default '',
  sort_order int not null default 0
);

create table research_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('method', 'finding', 'limitation', 'diagram')),
  title_en text not null,
  title_bn text not null,
  body_en text not null default '',
  body_bn text not null default '',
  image text not null default '',
  sort_order int not null default 0
);

create table test_results (
  id uuid primary key default gen_random_uuid(),
  parameter_en text not null,
  parameter_bn text not null,
  unit text not null default '',
  raw_value numeric,
  filtered_value numeric,
  control_value numeric,
  standard_value numeric,
  standard_source text not null default '',
  lab_name text not null default '',
  sample_date date,
  status text not null default 'sample' check (status in ('pending', 'sample', 'verified')),
  sort_order int not null default 0
);

create table impact_stats (
  id uuid primary key default gen_random_uuid(),
  label_en text not null,
  label_bn text not null,
  value numeric not null default 0,
  prefix text not null default '',
  suffix text not null default '',
  is_sample boolean not null default true,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- community
-- ---------------------------------------------------------------------------
create table community_visits (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text not null,
  description_en text not null default '',
  description_bn text not null default '',
  visit_date date,
  cover_image text not null default '',
  sort_order int not null default 0
);

create table community_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references community_visits(id) on delete cascade,
  url text not null,
  caption_en text not null default '',
  caption_bn text not null default '',
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- team / testimonials / faqs / partners / downloads
-- ---------------------------------------------------------------------------
create table team_members (
  id uuid primary key default gen_random_uuid(),
  group_type text not null default 'team' check (group_type in ('team', 'facilitator', 'mentor')),
  name text not null,
  title_en text not null default '',
  title_bn text not null default '',
  department text not null default '',
  bio_en text not null default '',
  bio_bn text not null default '',
  photo_url text not null default '',
  links jsonb not null default '{}'::jsonb,
  sort_order int not null default 0
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_en text not null default '',
  role_bn text not null default '',
  quote_en text not null default '',
  quote_bn text not null default '',
  avatar_url text not null default '',
  is_sample boolean not null default true,
  sort_order int not null default 0
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_bn text not null,
  answer_en text not null default '',
  answer_bn text not null default '',
  sort_order int not null default 0
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null default '',
  url text not null default '',
  sort_order int not null default 0
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_bn text not null,
  file_url text not null,
  file_type text not null default 'pdf',
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- orders / messages / subscribers / media / audit
-- ---------------------------------------------------------------------------
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_name text not null,
  phone text not null,
  email text not null default '',
  address text not null,
  district text not null,
  note text not null default '',
  status text not null default 'new' check (status in ('new', 'confirmed', 'packed', 'delivered', 'cancelled')),
  total numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_orders_updated before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name_en text not null,
  product_name_bn text not null,
  unit_price numeric(10, 2) not null,
  quantity int not null default 1
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null default '',
  subject text not null default '',
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_messages_updated before update on contact_messages
  for each row execute function set_updated_at();

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt_en text not null default '',
  alt_bn text not null default '',
  kind text not null default 'image' check (kind in ('image', 'pdf')),
  created_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default '',
  action text not null,
  table_name text not null,
  record_id text not null default '',
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table site_settings enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_specs enable row level security;
alter table product_benefits enable row level security;
alter table process_steps enable row level security;
alter table article_categories enable row level security;
alter table articles enable row level security;
alter table journey_milestones enable row level security;
alter table research_items enable row level security;
alter table test_results enable row level security;
alter table impact_stats enable row level security;
alter table community_visits enable row level security;
alter table community_photos enable row level security;
alter table team_members enable row level security;
alter table testimonials enable row level security;
alter table faqs enable row level security;
alter table partners enable row level security;
alter table downloads enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table contact_messages enable row level security;
alter table subscribers enable row level security;
alter table media enable row level security;
alter table audit_log enable row level security;

-- Helper: is the current user an authenticated admin (any role)?
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid());
$$ language sql stable security definer;

create or replace function is_super_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$ language sql stable security definer;

-- profiles: only super_admin manages profiles; users can read their own row
create policy profiles_self_select on profiles for select using (id = auth.uid() or is_super_admin());
create policy profiles_super_admin_write on profiles for insert with check (is_super_admin());
create policy profiles_super_admin_update on profiles for update using (is_super_admin());
create policy profiles_super_admin_delete on profiles for delete using (is_super_admin());

-- settings: public read, admin write
create policy settings_public_read on site_settings for select using (true);
create policy settings_admin_write on site_settings for insert with check (is_admin());
create policy settings_admin_update on site_settings for update using (is_admin());
create policy settings_admin_delete on site_settings for delete using (is_admin());

-- products + children: public reads published only, admin full access
create policy products_public_read on products for select using (is_published = true or is_admin());
create policy products_admin_write on products for insert with check (is_admin());
create policy products_admin_update on products for update using (is_admin());
create policy products_admin_delete on products for delete using (is_admin());

create policy product_images_read on product_images for select using (
  exists (select 1 from products p where p.id = product_id and (p.is_published or is_admin()))
);
create policy product_images_admin_write on product_images for insert with check (is_admin());
create policy product_images_admin_update on product_images for update using (is_admin());
create policy product_images_admin_delete on product_images for delete using (is_admin());

create policy product_specs_read on product_specs for select using (
  exists (select 1 from products p where p.id = product_id and (p.is_published or is_admin()))
);
create policy product_specs_admin_write on product_specs for insert with check (is_admin());
create policy product_specs_admin_update on product_specs for update using (is_admin());
create policy product_specs_admin_delete on product_specs for delete using (is_admin());

create policy product_benefits_read on product_benefits for select using (
  exists (select 1 from products p where p.id = product_id and (p.is_published or is_admin()))
);
create policy product_benefits_admin_write on product_benefits for insert with check (is_admin());
create policy product_benefits_admin_update on product_benefits for update using (is_admin());
create policy product_benefits_admin_delete on product_benefits for delete using (is_admin());

create policy process_steps_read on process_steps for select using (
  product_id is null or exists (select 1 from products p where p.id = product_id and (p.is_published or is_admin()))
);
create policy process_steps_admin_write on process_steps for insert with check (is_admin());
create policy process_steps_admin_update on process_steps for update using (is_admin());
create policy process_steps_admin_delete on process_steps for delete using (is_admin());

-- article categories: public read, admin write
create policy categories_public_read on article_categories for select using (true);
create policy categories_admin_write on article_categories for insert with check (is_admin());
create policy categories_admin_update on article_categories for update using (is_admin());
create policy categories_admin_delete on article_categories for delete using (is_admin());

-- articles: public reads published only
create policy articles_public_read on articles for select using (status = 'published' or is_admin());
create policy articles_admin_write on articles for insert with check (is_admin());
create policy articles_admin_update on articles for update using (is_admin());
create policy articles_admin_delete on articles for delete using (is_admin());

-- simple public-read / admin-write tables
create policy journey_read on journey_milestones for select using (true);
create policy journey_admin_write on journey_milestones for insert with check (is_admin());
create policy journey_admin_update on journey_milestones for update using (is_admin());
create policy journey_admin_delete on journey_milestones for delete using (is_admin());

create policy research_read on research_items for select using (true);
create policy research_admin_write on research_items for insert with check (is_admin());
create policy research_admin_update on research_items for update using (is_admin());
create policy research_admin_delete on research_items for delete using (is_admin());

create policy test_results_read on test_results for select using (true);
create policy test_results_admin_write on test_results for insert with check (is_admin());
create policy test_results_admin_update on test_results for update using (is_admin());
create policy test_results_admin_delete on test_results for delete using (is_admin());

create policy impact_stats_read on impact_stats for select using (true);
create policy impact_stats_admin_write on impact_stats for insert with check (is_admin());
create policy impact_stats_admin_update on impact_stats for update using (is_admin());
create policy impact_stats_admin_delete on impact_stats for delete using (is_admin());

create policy community_visits_read on community_visits for select using (true);
create policy community_visits_admin_write on community_visits for insert with check (is_admin());
create policy community_visits_admin_update on community_visits for update using (is_admin());
create policy community_visits_admin_delete on community_visits for delete using (is_admin());

create policy community_photos_read on community_photos for select using (true);
create policy community_photos_admin_write on community_photos for insert with check (is_admin());
create policy community_photos_admin_update on community_photos for update using (is_admin());
create policy community_photos_admin_delete on community_photos for delete using (is_admin());

create policy team_read on team_members for select using (true);
create policy team_admin_write on team_members for insert with check (is_admin());
create policy team_admin_update on team_members for update using (is_admin());
create policy team_admin_delete on team_members for delete using (is_admin());

create policy testimonials_read on testimonials for select using (true);
create policy testimonials_admin_write on testimonials for insert with check (is_admin());
create policy testimonials_admin_update on testimonials for update using (is_admin());
create policy testimonials_admin_delete on testimonials for delete using (is_admin());

create policy faqs_read on faqs for select using (true);
create policy faqs_admin_write on faqs for insert with check (is_admin());
create policy faqs_admin_update on faqs for update using (is_admin());
create policy faqs_admin_delete on faqs for delete using (is_admin());

create policy partners_read on partners for select using (true);
create policy partners_admin_write on partners for insert with check (is_admin());
create policy partners_admin_update on partners for update using (is_admin());
create policy partners_admin_delete on partners for delete using (is_admin());

create policy downloads_read on downloads for select using (true);
create policy downloads_admin_write on downloads for insert with check (is_admin());
create policy downloads_admin_update on downloads for update using (is_admin());
create policy downloads_admin_delete on downloads for delete using (is_admin());

-- orders: anon may INSERT only (checkout); only admins may read/update/delete
create policy orders_admin_read on orders for select using (is_admin());
create policy orders_public_insert on orders for insert with check (true);
create policy orders_admin_update on orders for update using (is_admin());
create policy orders_admin_delete on orders for delete using (is_admin());

create policy order_items_admin_read on order_items for select using (is_admin());
create policy order_items_public_insert on order_items for insert with check (true);
create policy order_items_admin_update on order_items for update using (is_admin());
create policy order_items_admin_delete on order_items for delete using (is_admin());

-- contact_messages: anon may INSERT only; only admins may read/update/delete
create policy messages_admin_read on contact_messages for select using (is_admin());
create policy messages_public_insert on contact_messages for insert with check (true);
create policy messages_admin_update on contact_messages for update using (is_admin());
create policy messages_admin_delete on contact_messages for delete using (is_admin());

-- subscribers: anon may INSERT only
create policy subscribers_admin_read on subscribers for select using (is_admin());
create policy subscribers_public_insert on subscribers for insert with check (true);
create policy subscribers_admin_delete on subscribers for delete using (is_admin());

-- media: public read, admin write
create policy media_public_read on media for select using (true);
create policy media_admin_write on media for insert with check (is_admin());
create policy media_admin_delete on media for delete using (is_admin());

-- audit_log: insert-only (via trigger, run as admin), readable by admins only
create policy audit_admin_read on audit_log for select using (is_admin());
create policy audit_insert on audit_log for insert with check (is_admin());

-- ============================================================================
-- Generic audit trigger — logs insert/update/delete on key content tables
-- ============================================================================
create or replace function log_audit()
returns trigger as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_record_id text;
begin
  if tg_op in ('update', 'delete') then
    v_old := to_jsonb(old);
  end if;
  if tg_op in ('update', 'insert') then
    v_new := to_jsonb(new);
  end if;

  v_record_id := coalesce(
    v_new->>'id',
    v_old->>'id',
    v_new->>'key',
    v_old->>'key',
    v_new->>'slug',
    v_old->>'slug',
    v_new->>'email',
    v_old->>'email',
    v_new->>'order_no',
    v_old->>'order_no',
    '(unknown)'
  );

  insert into audit_log (actor, action, table_name, record_id, before, after)
  values (
    coalesce(auth.uid()::text, 'system'),
    lower(tg_op),
    tg_table_name,
    v_record_id,
    v_old,
    v_new
  );
  if tg_op = 'delete' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_audit_products after insert or update or delete on products
  for each row execute function log_audit();
create trigger trg_audit_articles after insert or update or delete on articles
  for each row execute function log_audit();
create trigger trg_audit_orders after insert or update or delete on orders
  for each row execute function log_audit();

-- ============================================================================
-- Storage bucket: "media" (public read, admin write, 5MB images / 10MB PDFs)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'])
on conflict (id) do nothing;

create policy "media bucket public read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media bucket admin write" on storage.objects for insert
  with check (bucket_id = 'media' and is_admin());

create policy "media bucket admin update" on storage.objects for update
  using (bucket_id = 'media' and is_admin());

create policy "media bucket admin delete" on storage.objects for delete
  using (bucket_id = 'media' and is_admin());
