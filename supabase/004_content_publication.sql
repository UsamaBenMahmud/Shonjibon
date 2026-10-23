-- Existing public content remains published; admins can now unpublish individual records.
alter table public.profiles add column if not exists email text not null default '';
update public.profiles profile
set email = auth_user.email
from auth.users auth_user
where auth_user.id = profile.id and profile.email = '';

alter table public.articles add column if not exists sort_order integer not null default 0;
with article_order as (
  select id, row_number() over (order by published_at desc nulls last, created_at desc)::integer as position
  from public.articles
)
update public.articles article
set sort_order = article_order.position
from article_order
where article.id = article_order.id and article.sort_order = 0;

alter table public.test_results add column if not exists is_sample boolean not null default false;
update public.test_results set is_sample = true where status = 'sample' and is_sample = false;

alter table article_categories add column if not exists is_published boolean not null default true;
alter table journey_milestones add column if not exists is_published boolean not null default true;
alter table research_items add column if not exists is_published boolean not null default true;
alter table test_results add column if not exists is_published boolean not null default true;
alter table impact_stats add column if not exists is_published boolean not null default true;
alter table community_visits add column if not exists is_published boolean not null default true;
alter table team_members add column if not exists is_published boolean not null default true;
alter table testimonials add column if not exists is_published boolean not null default true;
alter table faqs add column if not exists is_published boolean not null default true;
alter table partners add column if not exists is_published boolean not null default true;
alter table downloads add column if not exists is_published boolean not null default true;

drop policy if exists categories_public_read on article_categories;
create policy categories_public_read on article_categories for select
  using (is_published = true or public.is_admin());

drop policy if exists journey_read on journey_milestones;
create policy journey_read on journey_milestones for select
  using (is_published = true or public.is_admin());

drop policy if exists research_read on research_items;
create policy research_read on research_items for select
  using (is_published = true or public.is_admin());

drop policy if exists test_results_read on test_results;
create policy test_results_read on test_results for select
  using ((is_published = true and status <> 'sample' and is_sample = false) or public.is_admin());

drop policy if exists impact_stats_read on impact_stats;
create policy impact_stats_read on impact_stats for select
  using ((is_published = true and is_sample = false) or public.is_admin());

drop policy if exists community_visits_read on community_visits;
create policy community_visits_read on community_visits for select
  using (is_published = true or public.is_admin());

drop policy if exists community_photos_read on community_photos;
create policy community_photos_read on community_photos for select using (
  exists (
    select 1 from community_visits visit
    where visit.id = visit_id
      and (visit.is_published = true or public.is_admin())
  )
);

drop policy if exists team_read on team_members;
create policy team_read on team_members for select
  using (is_published = true or public.is_admin());

drop policy if exists testimonials_read on testimonials;
create policy testimonials_read on testimonials for select
  using ((is_published = true and is_sample = false) or public.is_admin());

drop policy if exists faqs_read on faqs;
create policy faqs_read on faqs for select
  using (is_published = true or public.is_admin());

drop policy if exists partners_read on partners;
create policy partners_read on partners for select
  using (is_published = true or public.is_admin());

drop policy if exists downloads_read on downloads;
create policy downloads_read on downloads for select
  using (is_published = true or public.is_admin());

create trigger trg_audit_categories after insert or update or delete on public.article_categories
  for each row execute function public.log_audit();
create trigger trg_audit_product_images after insert or update or delete on public.product_images
  for each row execute function public.log_audit();
create trigger trg_audit_product_specs after insert or update or delete on public.product_specs
  for each row execute function public.log_audit();
create trigger trg_audit_product_benefits after insert or update or delete on public.product_benefits
  for each row execute function public.log_audit();
create trigger trg_audit_process_steps after insert or update or delete on public.process_steps
  for each row execute function public.log_audit();
create trigger trg_audit_journey after insert or update or delete on public.journey_milestones
  for each row execute function public.log_audit();
create trigger trg_audit_research after insert or update or delete on public.research_items
  for each row execute function public.log_audit();
create trigger trg_audit_test_results after insert or update or delete on public.test_results
  for each row execute function public.log_audit();
create trigger trg_audit_impact after insert or update or delete on public.impact_stats
  for each row execute function public.log_audit();
create trigger trg_audit_community after insert or update or delete on public.community_visits
  for each row execute function public.log_audit();
create trigger trg_audit_community_photos after insert or update or delete on public.community_photos
  for each row execute function public.log_audit();
create trigger trg_audit_team after insert or update or delete on public.team_members
  for each row execute function public.log_audit();
create trigger trg_audit_testimonials after insert or update or delete on public.testimonials
  for each row execute function public.log_audit();
create trigger trg_audit_faqs after insert or update or delete on public.faqs
  for each row execute function public.log_audit();
create trigger trg_audit_partners after insert or update or delete on public.partners
  for each row execute function public.log_audit();
create trigger trg_audit_downloads after insert or update or delete on public.downloads
  for each row execute function public.log_audit();
create trigger trg_audit_site_settings after insert or update or delete on public.site_settings
  for each row execute function public.log_audit();
create trigger trg_audit_contact_messages after insert or update or delete on public.contact_messages
  for each row execute function public.log_audit();
create trigger trg_audit_subscribers after insert or update or delete on public.subscribers
  for each row execute function public.log_audit();
create trigger trg_audit_media after insert or update or delete on public.media
  for each row execute function public.log_audit();
create trigger trg_audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.log_audit();
