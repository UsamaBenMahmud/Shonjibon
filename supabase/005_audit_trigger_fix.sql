-- Audit trigger rows generically because some audited tables use keys other than id.
create or replace function public.log_audit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  insert into public.audit_log (actor, action, table_name, record_id, before, after)
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
$$;
