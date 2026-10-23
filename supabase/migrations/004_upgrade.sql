create table if not exists public.nav_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.nav_items(id) on delete cascade,
  label_en text not null,
  label_bn text not null,
  path text not null,
  group_key text not null default '',
  is_visible boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null check (page_key in ('coastal', 'concerns', 'health')),
  type text not null check (type in ('text', 'cards', 'stats', 'quote', 'image', 'cta')),
  title_en text not null default '',
  title_bn text not null default '',
  body_en text not null default '',
  body_bn text not null default '',
  image text not null default '',
  icon text not null default '',
  source_name text not null default '',
  source_url text not null default '',
  is_sample boolean not null default false,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_bn text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_en text not null,
  name_bn text not null,
  sku text unique not null,
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sort_order integer not null default 0
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 0)
);

alter table public.products add column if not exists sku text;
alter table public.products add column if not exists category_id uuid references public.product_categories(id) on delete set null;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists sale_price numeric(10,2);
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists low_stock_threshold integer not null default 5;
alter table public.products add column if not exists weight numeric(10,2);
alter table public.products add column if not exists delivery_note_en text not null default '';
alter table public.products add column if not exists delivery_note_bn text not null default '';
alter table public.products add column if not exists badges text[] not null default '{}';
alter table public.products add column if not exists is_featured boolean not null default false;
alter table public.products add column if not exists seo_title_en text not null default '';
alter table public.products add column if not exists seo_title_bn text not null default '';
alter table public.products add column if not exists seo_description_en text not null default '';
alter table public.products add column if not exists seo_description_bn text not null default '';

update public.products
set sku = upper(regexp_replace(slug, '[^a-zA-Z0-9]+', '-', 'g'))
where sku is null;
update public.products
set stock_quantity = case when stock_status = 'out_of_stock' then 0 else 10 end
where stock_quantity = 0 and stock_status <> 'out_of_stock';

create unique index if not exists products_sku_unique on public.products(sku);
alter table public.products add constraint products_sale_price_check
  check (sale_price is null or (sale_price >= 0 and sale_price < price));
alter table public.products add constraint products_stock_quantity_check check (stock_quantity >= 0);

create or replace function public.create_order(customer jsonb, items jsonb)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_no text;
  v_total numeric(10, 2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_item_count integer;
  v_unique_product_count integer;
begin
  if jsonb_typeof(customer) is distinct from 'object'
    or jsonb_typeof(items) is distinct from 'array'
    or coalesce(jsonb_array_length(items), 0) = 0
    or jsonb_array_length(items) > 100 then
    raise exception 'Invalid order payload';
  end if;

  select count(*), count(distinct value->>'product_id')
  into v_item_count, v_unique_product_count
  from jsonb_array_elements(items);
  if v_item_count <> v_unique_product_count then
    raise exception 'Duplicate products must be combined into one order item';
  end if;

  if length(trim(coalesce(customer->>'customer_name', ''))) < 2
    or length(trim(coalesce(customer->>'phone', ''))) < 6
    or length(trim(coalesce(customer->>'address', ''))) < 5
    or length(trim(coalesce(customer->>'district', ''))) < 2 then
    raise exception 'Invalid customer details';
  end if;

  for v_item in select value from jsonb_array_elements(items)
  loop
    if coalesce(v_item->>'product_id', '') !~* '^[0-9a-f-]{36}$'
      or coalesce(v_item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$' then
      raise exception 'Invalid order item';
    end if;
    v_quantity := (v_item->>'quantity')::integer;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and is_published = true
      and stock_status in ('in_stock', 'preorder')
    for update;

    if not found then
      raise exception 'Product is unavailable';
    end if;
    if v_product.stock_status <> 'preorder' and v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock';
    end if;

    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  v_order_no := 'SJ-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into public.orders (
    order_no, customer_name, phone, email, address, district, note, status, total
  ) values (
    v_order_no,
    trim(customer->>'customer_name'),
    trim(customer->>'phone'),
    coalesce(trim(customer->>'email'), ''),
    trim(customer->>'address'),
    trim(customer->>'district'),
    coalesce(trim(customer->>'note'), ''),
    'new',
    v_total
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid;
    v_unit_price := coalesce(v_product.sale_price, v_product.price);

    insert into public.order_items (
      order_id, product_id, product_name_en, product_name_bn, unit_price, quantity
    ) values (
      v_order_id, v_product.id, v_product.name_en, v_product.name_bn, v_unit_price, v_quantity
    );

    if v_product.stock_status <> 'preorder' then
      update public.products
      set stock_quantity = stock_quantity - v_quantity
      where id = v_product.id;
    end if;
  end loop;

  return v_order_no;
end;
$$;

create or replace function public.sync_product_stock_status()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.stock_status in ('preorder', 'coming_soon') then
    return new;
  elsif new.stock_quantity = 0 then
    new.stock_status := 'out_of_stock';
  else
    new.stock_status := 'in_stock';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_product_stock_status on public.products;
create trigger trg_sync_product_stock_status before insert or update of stock_quantity, stock_status
  on public.products for each row execute function public.sync_product_stock_status();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['nav_items', 'page_sections', 'product_categories', 'product_variants', 'coupons']
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy nav_items_public_read on public.nav_items for select using (is_visible or public.is_admin());
create policy nav_items_admin_write on public.nav_items for all using (public.is_admin()) with check (public.is_admin());
create policy page_sections_public_read on public.page_sections for select using (is_visible and not is_sample or public.is_admin());
create policy page_sections_admin_write on public.page_sections for all using (public.is_admin()) with check (public.is_admin());
create policy product_categories_public_read on public.product_categories for select using (is_published or public.is_admin());
create policy product_categories_admin_write on public.product_categories for all using (public.is_admin()) with check (public.is_admin());
create policy product_variants_public_read on public.product_variants for select using (
  exists (select 1 from public.products p where p.id = product_id and (p.is_published or public.is_admin()))
);
create policy product_variants_admin_write on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy coupons_admin_read on public.coupons for select using (public.is_admin());
create policy coupons_admin_write on public.coupons for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 1048576, array['image/svg+xml', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists branding_public_read on storage.objects;
drop policy if exists branding_admin_write on storage.objects;
drop policy if exists branding_admin_update on storage.objects;
drop policy if exists branding_admin_delete on storage.objects;
create policy branding_public_read on storage.objects for select using (bucket_id = 'branding');
create policy branding_admin_write on storage.objects for insert with check (bucket_id = 'branding' and public.is_admin());
create policy branding_admin_update on storage.objects for update
  using (bucket_id = 'branding' and public.is_admin())
  with check (bucket_id = 'branding' and public.is_admin());
create policy branding_admin_delete on storage.objects for delete using (bucket_id = 'branding' and public.is_admin());

insert into public.site_settings (key, value) values
  ('contact', '{"phone":"01620485218","email":"","address":"","hours":"","map_link":"","whatsapp_enabled":false}'::jsonb),
  ('branding', '{"site_name_en":"Shonjibon","site_name_bn":"সঞ্জীবন","tagline_en":"New life from waste","tagline_bn":"বর্জ্য থেকে নতুন জীবন","logo_light":"/brand-logo-original.png","logo_dark":"","favicon":"/favicon.svg","logo_height":36}'::jsonb),
  ('theme', '{"preset":"ocean-deep","teal":"#127986","ocean_deep":"#0B3D4A","coral":"#F2795B"}'::jsonb)
on conflict (key) do nothing;

create trigger trg_audit_nav_items after insert or update or delete on public.nav_items
  for each row execute function public.log_audit();
create trigger trg_audit_page_sections after insert or update or delete on public.page_sections
  for each row execute function public.log_audit();
create trigger trg_audit_product_categories after insert or update or delete on public.product_categories
  for each row execute function public.log_audit();
create trigger trg_audit_product_variants after insert or update or delete on public.product_variants
  for each row execute function public.log_audit();
create trigger trg_audit_coupons after insert or update or delete on public.coupons
  for each row execute function public.log_audit();
