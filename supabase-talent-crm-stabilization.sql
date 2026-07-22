-- MXVL Sprint 7.6.1: Talent CRM stabilization and activation.
-- Run after supabase-talent-crm.sql. This migration is additive and idempotent.

create or replace function public.crm_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists talent_pools_touch_updated_at on public.talent_pools;
create trigger talent_pools_touch_updated_at before update on public.talent_pools
for each row execute function public.crm_touch_updated_at();

drop trigger if exists talent_pool_members_touch_updated_at on public.talent_pool_members;
create trigger talent_pool_members_touch_updated_at before update on public.talent_pool_members
for each row execute function public.crm_touch_updated_at();

drop trigger if exists employer_contacts_touch_updated_at on public.employer_contacts;
create trigger employer_contacts_touch_updated_at before update on public.employer_contacts
for each row execute function public.crm_touch_updated_at();

drop trigger if exists employee_referrals_touch_updated_at on public.employee_referrals;
create trigger employee_referrals_touch_updated_at before update on public.employee_referrals
for each row execute function public.crm_touch_updated_at();

drop trigger if exists career_pages_touch_updated_at on public.career_pages;
create trigger career_pages_touch_updated_at before update on public.career_pages
for each row execute function public.crm_touch_updated_at();

drop trigger if exists offer_templates_touch_updated_at on public.offer_templates;
create trigger offer_templates_touch_updated_at before update on public.offer_templates
for each row execute function public.crm_touch_updated_at();

drop trigger if exists talent_messages_touch_updated_at on public.talent_messages;
create trigger talent_messages_touch_updated_at before update on public.talent_messages
for each row execute function public.crm_touch_updated_at();

create index if not exists referral_history_referral_created_idx
  on public.referral_history (referral_id, created_at desc);
create index if not exists talent_messages_owner_created_idx
  on public.talent_messages (employer_user_id, created_at desc);
create index if not exists talent_messages_owner_status_created_idx
  on public.talent_messages (employer_user_id, status, created_at desc);
create index if not exists communication_logs_contact_occurred_idx
  on public.communication_logs (contact_id, occurred_at desc);
create index if not exists career_page_events_page_type_created_idx
  on public.career_page_events (career_page_id, event_type, created_at desc);

-- Published career pages are publicly readable, but only workspace members can
-- insert, update, or delete them. Splitting these policies prevents a published
-- row from satisfying a broad FOR ALL delete policy.
drop policy if exists career_pages_workspace_write on public.career_pages;
drop policy if exists career_pages_workspace_access on public.career_pages;
drop policy if exists career_pages_public_read on public.career_pages;
create policy career_pages_workspace_access on public.career_pages for all to authenticated
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));
create policy career_pages_public_read on public.career_pages for select to anon, authenticated
  using (is_published);

drop policy if exists career_events_public_insert on public.career_page_events;
create policy career_events_public_insert on public.career_page_events for insert to anon, authenticated
  with check (exists (
    select 1 from public.career_pages page
    where page.id = career_page_id and page.is_published
  ));

grant select, insert, update, delete on public.talent_pools to authenticated;
grant select, insert, update, delete on public.talent_pool_members to authenticated;
grant select, insert, update, delete on public.employer_contacts to authenticated;
grant select, insert, update, delete on public.employee_referrals to authenticated;
grant select, insert on public.referral_history to authenticated;
grant select, insert, update, delete on public.career_pages to authenticated;
grant select on public.career_pages to anon;
grant select, insert on public.career_page_events to authenticated;
grant insert on public.career_page_events to anon;
grant select, insert, update, delete on public.offer_templates to authenticated;
grant select, insert on public.offer_template_versions to authenticated;
grant select, insert, update, delete on public.talent_messages to authenticated;
grant select, insert on public.communication_logs to authenticated;
grant select, insert, update, delete on public.candidate_portal_documents to authenticated;
grant execute on function public.crm_workspace_member(uuid) to authenticated;

create or replace function public.crm_schema_health()
returns table(object_type text, object_name text, is_present boolean)
language sql
stable
security definer
set search_path = public
as $$
  select 'table', required.name, to_regclass('public.' || required.name) is not null
  from (values
    ('talent_pools'),
    ('talent_pool_members'),
    ('employer_contacts'),
    ('employee_referrals'),
    ('referral_history'),
    ('career_pages'),
    ('career_page_events'),
    ('offer_templates'),
    ('offer_template_versions'),
    ('talent_messages'),
    ('communication_logs'),
    ('candidate_portal_documents')
  ) as required(name)
  union all
  select 'function', 'crm_workspace_member', to_regprocedure('public.crm_workspace_member(uuid)') is not null;
$$;

revoke all on function public.crm_schema_health() from public;
grant execute on function public.crm_schema_health() to authenticated, service_role;

create or replace function public.crm_talent_metrics(target_owner uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  employer_record_id uuid;
  result jsonb;
begin
  if auth.role() <> 'service_role' and not public.crm_workspace_member(target_owner) then
    raise exception 'Talent CRM workspace access is required.' using errcode = '42501';
  end if;

  select employer.id into employer_record_id
  from public.employers employer
  where employer.user_id = target_owner
  order by employer.created_at
  limit 1;

  select jsonb_build_object(
    'totalPoolMembers', (
      select count(*) from public.talent_pool_members member
      join public.talent_pools pool on pool.id = member.pool_id
      where pool.employer_user_id = target_owner
    ),
    'activePools', (
      select count(*) from public.talent_pools pool
      where pool.employer_user_id = target_owner and not pool.is_archived
    ),
    'poolGrowth', (
      select count(*) from public.talent_pool_members member
      join public.talent_pools pool on pool.id = member.pool_id
      where pool.employer_user_id = target_owner
        and member.created_at >= date_trunc('month', now())
    ),
    'referrals', (
      select count(*) from public.employee_referrals referral
      where referral.employer_user_id = target_owner
    ),
    'referralConversion', coalesce((
      select round(100.0 * count(*) filter (where referral.status = 'hired') / nullif(count(*), 0))
      from public.employee_referrals referral
      where referral.employer_user_id = target_owner
    ), 0),
    'careerPageViews', (
      select count(*) from public.career_page_events event
      join public.career_pages page on page.id = event.career_page_id
      where page.employer_user_id = target_owner and event.event_type = 'view'
    ),
    'applicationConversion', coalesce((
      select round(100.0 * count(*) filter (where event.event_type = 'application_completed') /
        nullif(count(*) filter (where event.event_type = 'view'), 0))
      from public.career_page_events event
      join public.career_pages page on page.id = event.career_page_id
      where page.employer_user_id = target_owner
    ), 0),
    'messagesSent', (
      select count(*) from public.talent_messages message
      where message.employer_user_id = target_owner and message.status in ('sent', 'delivered', 'read')
    ),
    'sourceQuality', coalesce((
      select jsonb_agg(jsonb_build_object(
        'source', grouped.source,
        'candidates', grouped.candidates,
        'hires', grouped.hires,
        'conversion', case when grouped.candidates = 0 then 0 else round(100.0 * grouped.hires / grouped.candidates) end
      ) order by grouped.candidates desc, grouped.source)
      from (
        select coalesce(nullif(stage.source, ''), 'Direct') as source,
          count(*) as candidates,
          count(*) filter (where lower(application.status) = 'hired') as hires
        from public.applications application
        left join public.candidate_stages stage on stage.application_id = application.id
        where application.employer_user_id = target_owner
          or (employer_record_id is not null and application.employer_id = employer_record_id)
        group by coalesce(nullif(stage.source, ''), 'Direct')
      ) grouped
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.crm_talent_metrics(uuid) from public;
grant execute on function public.crm_talent_metrics(uuid) to authenticated, service_role;
