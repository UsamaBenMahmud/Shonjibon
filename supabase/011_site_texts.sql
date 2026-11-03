create table if not exists public.site_texts (
  key text primary key check (length(trim(key)) between 1 and 160),
  en text not null default '',
  bn text not null default '',
  "group" text not null default 'general'
);

alter table public.site_texts enable row level security;

drop policy if exists site_texts_public_read on public.site_texts;
create policy site_texts_public_read on public.site_texts
  for select using (true);

drop policy if exists site_texts_admin_insert on public.site_texts;
create policy site_texts_admin_insert on public.site_texts
  for insert with check (public.is_admin());

drop policy if exists site_texts_admin_update on public.site_texts;
create policy site_texts_admin_update on public.site_texts
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists site_texts_admin_delete on public.site_texts;
create policy site_texts_admin_delete on public.site_texts
  for delete using (public.is_admin());

drop trigger if exists audit_site_texts on public.site_texts;
create trigger audit_site_texts
  after insert or update or delete on public.site_texts
  for each row execute function public.log_audit();
