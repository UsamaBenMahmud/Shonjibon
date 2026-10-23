-- Run after 008_customer_accounts_security.sql. Raises on any missing control.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'orders', 'order_items', 'customer_addresses', 'customer_wishlist'
  ]
  loop
    if not coalesce((
      select relrowsecurity
      from pg_class
      where oid = format('public.%I', table_name)::regclass
    ), false) then
      raise exception 'RLS is not enabled on public.%', table_name;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.create_order(jsonb,jsonb)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.create_order(jsonb,jsonb)', 'EXECUTE') then
    raise exception 'Untrusted roles can execute create_order';
  end if;
  if not has_function_privilege('service_role', 'public.create_order(jsonb,jsonb)', 'EXECUTE') then
    raise exception 'service_role cannot execute create_order';
  end if;

  if has_table_privilege('anon', 'public.orders', 'INSERT')
    or has_table_privilege('authenticated', 'public.orders', 'INSERT')
    or has_table_privilege('anon', 'public.order_items', 'INSERT')
    or has_table_privilege('authenticated', 'public.order_items', 'INSERT') then
    raise exception 'Untrusted roles can bypass create_order via direct inserts';
  end if;

  if exists (select 1 from public.site_settings where key = 'admin_password') then
    raise exception 'admin_password is exposed in public settings';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
      and policyname = 'orders_read_owner_or_admin'
  ) then
    raise exception 'Owner-scoped order read policy is missing';
  end if;
end;
$$;
