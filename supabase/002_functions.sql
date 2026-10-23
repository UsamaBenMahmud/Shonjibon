-- Server-owned order creation and hourly IP submission limits.
create sequence if not exists public.order_number_seq start with 1;

select setval(
  'public.order_number_seq',
  coalesce(
    max(substring(order_no from '^SJ-[0-9]{4}-([0-9]+)$')::bigint),
    0
  ) + 1,
  false
)
from public.orders
where order_no ~ ('^SJ-' || to_char(current_date, 'YYYY') || '-[0-9]+$');

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
  v_product products%rowtype;
  v_quantity integer;
begin
  if jsonb_typeof(customer) is distinct from 'object'
    or jsonb_typeof(items) is distinct from 'array'
    or coalesce(jsonb_array_length(items), 0) = 0
    or jsonb_array_length(items) > 100 then
    raise exception 'Invalid order payload';
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
    from products
    where id = (v_item->>'product_id')::uuid
      and is_published = true
      and stock_status in ('in_stock', 'preorder')
    for share;

    if not found then
      raise exception 'Product is unavailable';
    end if;

    v_total := v_total + (v_product.price * v_quantity);
  end loop;

  v_order_no := 'SJ-' || to_char(current_date, 'YYYY') || '-' ||
    lpad(nextval('public.order_number_seq')::text, 4, '0');

  insert into orders (
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
    from products
    where id = (v_item->>'product_id')::uuid;

    insert into order_items (
      order_id, product_id, product_name_en, product_name_bn, unit_price, quantity
    ) values (
      v_order_id, v_product.id, v_product.name_en, v_product.name_bn, v_product.price, v_quantity
    );
  end loop;

  return v_order_no;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

drop policy if exists orders_public_insert on public.orders;
drop policy if exists order_items_public_insert on public.order_items;
drop policy if exists messages_public_insert on public.contact_messages;
drop policy if exists subscribers_public_insert on public.subscribers;
revoke insert on public.orders, public.order_items, public.contact_messages, public.subscribers
  from anon, authenticated;

create table if not exists public.submission_rate_limits (
  action text not null check (action in ('orders', 'contact', 'subscribers')),
  ip_hash text not null,
  bucket_start timestamptz not null,
  submission_count integer not null check (submission_count between 1 and 5),
  primary key (action, ip_hash, bucket_start)
);
alter table public.submission_rate_limits enable row level security;

create or replace function public.consume_submission_rate_limit(p_action text, p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
  v_bucket timestamptz := date_trunc('hour', now());
begin
  if p_action is null
    or p_action not in ('orders', 'contact', 'subscribers')
    or p_ip_hash is null
    or length(p_ip_hash) <> 64
    or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate limit key';
  end if;

  delete from submission_rate_limits
  where bucket_start < v_bucket - interval '1 hour';

  insert into submission_rate_limits (action, ip_hash, bucket_start, submission_count)
  values (p_action, p_ip_hash, v_bucket, 1)
  on conflict (action, ip_hash, bucket_start) do update
    set submission_count = submission_rate_limits.submission_count + 1
    where submission_rate_limits.submission_count < 5
  returning submission_count into v_count;

  return v_count is not null;
end;
$$;

revoke all on function public.consume_submission_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_submission_rate_limit(text, text) to service_role;
