-- Customer accounts, owner-scoped data, and role-safe admin authorization.
alter table public.profiles
  alter column role set default 'customer',
  add column if not exists email text not null default '';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'editor', 'super_admin'));

update public.profiles
set email = coalesce(nullif(email, ''), auth_user.email, '')
from auth.users auth_user
where profiles.id = auth_user.id;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    'customer'
  )
  on conflict (id) do update
  set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists trg_create_customer_profile on auth.users;
create trigger trg_create_customer_profile
  after insert on auth.users
  for each row execute function public.create_customer_profile();

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_super_admin_write on public.profiles;
drop policy if exists profiles_super_admin_update on public.profiles;
drop policy if exists profiles_super_admin_delete on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_insert_super_admin on public.profiles for insert
  with check (public.is_super_admin());
create policy profiles_update_self_or_super_admin on public.profiles for update
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());
create policy profiles_delete_super_admin on public.profiles for delete
  using (public.is_super_admin());

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.role is distinct from new.role
    and coalesce(auth.role(), '') <> 'service_role'
    and not public.is_super_admin() then
    raise exception 'Only a super admin may change profile roles';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_change on public.profiles;
create trigger trg_prevent_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

alter table public.orders add column if not exists user_id uuid
  references public.profiles(id) on delete set null;
alter table public.orders add column if not exists payment_method text not null default 'cash_on_delivery'
  check (payment_method in ('cash_on_delivery', 'bank_transfer', 'mobile_money', 'sslcommerz'));
alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('cash_on_delivery', 'bank_transfer', 'mobile_money', 'sslcommerz'));
alter table public.orders add column if not exists payment_status text not null default 'unpaid'
  check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

insert into public.product_categories (slug, name_en, name_bn, sort_order, is_published) values
  ('water-filters', 'Water filters', 'পানি ফিল্টার', 1, true),
  ('shell-byproducts', 'Shell by-products', 'খোলসের উপজাত', 2, true)
on conflict (slug) do update
set name_en = excluded.name_en,
    name_bn = excluded.name_bn,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published;

update public.products
set category_id = (select id from public.product_categories where slug = 'water-filters')
where slug = 'shonjibon-water-filter';

update public.products
set category_id = (select id from public.product_categories where slug = 'shell-byproducts')
where slug in ('shonjibon-soyad', 'shell-craft-ornaments', 'chitoclear', 'agri-shelf-life-powder');

drop policy if exists orders_public_insert on public.orders;
drop policy if exists orders_admin_read on public.orders;
drop policy if exists orders_admin_update on public.orders;
drop policy if exists orders_admin_delete on public.orders;
create policy orders_read_owner_or_admin on public.orders for select
  using (user_id = auth.uid() or public.is_admin());
create policy orders_admin_update on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_delete on public.orders for delete
  using (public.is_admin());

drop policy if exists order_items_public_insert on public.order_items;
drop policy if exists order_items_admin_read on public.order_items;
drop policy if exists order_items_admin_update on public.order_items;
drop policy if exists order_items_admin_delete on public.order_items;
create policy order_items_read_owner_or_admin on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders
      where orders.id = order_items.order_id and orders.user_id = auth.uid()
    )
  );
create policy order_items_admin_update on public.order_items for update
  using (public.is_admin()) with check (public.is_admin());
create policy order_items_admin_delete on public.order_items for delete
  using (public.is_admin());
revoke insert on public.orders, public.order_items from anon, authenticated;

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  address text not null,
  district text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_addresses enable row level security;
drop policy if exists customer_addresses_owner_access on public.customer_addresses;
create policy customer_addresses_owner_access on public.customer_addresses
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop trigger if exists trg_customer_addresses_updated on public.customer_addresses;
create trigger trg_customer_addresses_updated before update on public.customer_addresses
  for each row execute function public.set_updated_at();

create table if not exists public.customer_wishlist (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.customer_wishlist enable row level security;
drop policy if exists customer_wishlist_owner_access on public.customer_wishlist;
create policy customer_wishlist_owner_access on public.customer_wishlist
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- The order RPC remains service-role-only. It accepts account identity only from
-- the Edge Function, which overwrites any client-supplied user_id.
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
  v_count integer;
begin
  if jsonb_typeof(customer) is distinct from 'object'
    or jsonb_typeof(items) is distinct from 'array'
    or coalesce(jsonb_array_length(items), 0) = 0
    or jsonb_array_length(items) > 100 then
    raise exception 'Invalid order payload';
  end if;

  select count(*) into v_count
  from jsonb_array_elements(items) as x(item)
  where coalesce(item->>'product_id', '') !~* '^[0-9a-f-]{36}$'
    or coalesce(item->>'quantity', '') !~ '^[1-9][0-9]{0,3}$';
  if v_count > 0 then raise exception 'Invalid order item'; end if;
  select count(*) into v_count from jsonb_array_elements(items);
  if v_count <> (select count(distinct item->>'product_id') from jsonb_array_elements(items) as x(item)) then
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
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products
    where id = (v_item->>'product_id')::uuid
      and is_published = true
      and stock_status in ('in_stock', 'preorder')
    for update;
    if not found then raise exception 'Product is unavailable'; end if;
    if v_product.stock_status <> 'preorder' and v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock';
    end if;
    v_total := v_total + coalesce(v_product.sale_price, v_product.price) * v_quantity;
  end loop;

  v_order_no := 'SJ-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');
  insert into public.orders (
    order_no, user_id, customer_name, phone, email, address, district, note,
    status, total, payment_method, payment_status
  ) values (
    v_order_no,
    nullif(customer->>'user_id', '')::uuid,
    trim(customer->>'customer_name'),
    trim(customer->>'phone'),
    coalesce(trim(customer->>'email'), ''),
    trim(customer->>'address'),
    trim(customer->>'district'),
    coalesce(trim(customer->>'note'), ''),
    'new',
    v_total,
    case when customer->>'payment_method' in ('bank_transfer', 'mobile_money', 'sslcommerz')
      then customer->>'payment_method' else 'cash_on_delivery' end,
    case when customer->>'payment_method' in ('bank_transfer', 'mobile_money', 'sslcommerz')
      then 'pending' else 'unpaid' end
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(items)
  loop
    v_quantity := (v_item->>'quantity')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_unit_price := coalesce(v_product.sale_price, v_product.price);
    insert into public.order_items (
      order_id, product_id, product_name_en, product_name_bn, unit_price, quantity
    ) values (
      v_order_id, v_product.id, v_product.name_en, v_product.name_bn, v_unit_price, v_quantity
    );
    if v_product.stock_status <> 'preorder' then
      update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
    end if;
  end loop;
  return v_order_no;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- The admin password must never be exposed through the public settings table.
delete from public.site_settings where key = 'admin_password';
