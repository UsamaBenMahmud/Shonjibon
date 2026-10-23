alter table public.test_results
  add column if not exists is_sample boolean not null default false;

update public.test_results
set is_sample = true
where status = 'sample' and is_sample = false;

create or replace function public.guard_test_result_sample_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.is_sample and not new.is_sample then
    raise exception 'Sample test results cannot be reclassified as real results';
  end if;

  if new.status = 'sample' then
    new.is_sample := true;
  end if;

  if new.is_sample and new.status = 'verified' then
    raise exception 'Sample test results cannot be verified';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_test_result_sample_status on public.test_results;
create trigger trg_guard_test_result_sample_status
before insert or update on public.test_results
for each row execute function public.guard_test_result_sample_status();
