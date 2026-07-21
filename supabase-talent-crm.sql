-- MXVL Sprint 7: Talent CRM & Employer Experience Platform
-- Run after supabase-enterprise-recruitment-workflow.sql.
-- Additive and idempotent; existing ATS records and workflows are not changed.

create extension if not exists pgcrypto;

create table if not exists public.talent_pools (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'team' check (visibility in ('private','team')),
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_user_id, name)
);

create index if not exists talent_pools_owner_active_idx
  on public.talent_pools (employer_user_id, is_archived, updated_at desc);

create table if not exists public.talent_pool_members (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.talent_pools(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  engagement_status text not null default 'interested' check (engagement_status in ('interested','passive','contacted','interviewed','offer_declined','silver_medalist','future_opportunity')),
  source text not null default 'manual',
  tags text[] not null default '{}',
  notes text,
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pool_id, candidate_id)
);

create index if not exists talent_pool_members_pool_status_idx
  on public.talent_pool_members (pool_id, engagement_status, updated_at desc);
create index if not exists talent_pool_members_candidate_idx
  on public.talent_pool_members (candidate_id, updated_at desc);

create table if not exists public.employer_contacts (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  work_email text,
  phone text,
  job_title text,
  department text,
  contact_type text not null default 'hiring_manager' check (contact_type in ('hiring_manager','recruiter','department_head','executive','other')),
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_contacts_owner_status_idx
  on public.employer_contacts (employer_user_id, status, updated_at desc);

create table if not exists public.employee_referrals (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  referrer_user_id uuid references auth.users(id) on delete set null,
  referrer_name text not null,
  referrer_email text,
  candidate_id uuid references public.candidates(id) on delete set null,
  candidate_name text not null,
  candidate_email text,
  job_id uuid references public.jobs(id) on delete set null,
  status text not null default 'submitted' check (status in ('submitted','reviewing','interviewing','hired','rejected','withdrawn')),
  reward_amount numeric not null default 0 check (reward_amount >= 0),
  reward_status text not null default 'not_eligible' check (reward_status in ('not_eligible','pending','approved','paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employee_referrals_owner_status_idx
  on public.employee_referrals (employer_user_id, status, created_at desc);

create table if not exists public.referral_history (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.employee_referrals(id) on delete cascade,
  previous_status text,
  new_status text not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.career_pages (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  company_name text not null,
  headline text,
  mission text,
  vision text,
  values jsonb not null default '[]'::jsonb,
  culture text,
  benefits jsonb not null default '[]'::jsonb,
  team_stories jsonb not null default '[]'::jsonb,
  logo_url text,
  cover_url text,
  video_url text,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_user_id)
);

create index if not exists career_pages_published_slug_idx
  on public.career_pages (is_published, slug);

create table if not exists public.career_page_events (
  id uuid primary key default gen_random_uuid(),
  career_page_id uuid not null references public.career_pages(id) on delete cascade,
  event_type text not null check (event_type in ('view','job_view','apply_click','application_started','application_completed')),
  job_id uuid references public.jobs(id) on delete set null,
  source text,
  session_hash text,
  created_at timestamptz not null default now()
);

create index if not exists career_page_events_page_created_idx
  on public.career_page_events (career_page_id, created_at desc, event_type);

create table if not exists public.offer_templates (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title_template text not null,
  body_template text not null,
  variables text[] not null default '{}',
  approval_steps jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  current_version integer not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_user_id, name)
);

create table if not exists public.offer_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.offer_templates(id) on delete cascade,
  version integer not null,
  title_template text not null,
  body_template text not null,
  variables text[] not null default '{}',
  approval_steps jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create index if not exists offer_templates_owner_active_idx
  on public.offer_templates (employer_user_id, is_archived, updated_at desc);

create table if not exists public.talent_messages (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  channel text not null default 'email' check (channel in ('email','in_app','sms','whatsapp')),
  direction text not null default 'outbound' check (direction in ('inbound','outbound')),
  message_type text not null default 'outreach' check (message_type in ('outreach','interview_invitation','follow_up','rejection','offer','general')),
  subject text,
  body text not null,
  status text not null default 'draft' check (status in ('draft','queued','sent','delivered','failed','read')),
  provider_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists talent_messages_owner_candidate_idx
  on public.talent_messages (employer_user_id, candidate_id, created_at desc);
create index if not exists talent_messages_application_idx
  on public.talent_messages (application_id, created_at desc);

create table if not exists public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.employer_contacts(id) on delete set null,
  candidate_id uuid references public.candidates(id) on delete set null,
  message_id uuid references public.talent_messages(id) on delete set null,
  channel text not null,
  direction text not null,
  subject text,
  summary text,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists communication_logs_owner_occurred_idx
  on public.communication_logs (employer_user_id, occurred_at desc);

create table if not exists public.candidate_portal_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  document_type text not null default 'supporting_document',
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists candidate_portal_documents_user_idx
  on public.candidate_portal_documents (candidate_user_id, created_at desc);

create or replace function public.crm_workspace_member(target_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() = target_owner
    or public.ats_is_admin()
    or exists (
      select 1 from public.recruitment_team_members member
      where member.employer_user_id = target_owner
        and member.user_id = auth.uid()
        and member.status = 'active'
    );
$$;

alter table public.talent_pools enable row level security;
alter table public.talent_pool_members enable row level security;
alter table public.employer_contacts enable row level security;
alter table public.employee_referrals enable row level security;
alter table public.referral_history enable row level security;
alter table public.career_pages enable row level security;
alter table public.career_page_events enable row level security;
alter table public.offer_templates enable row level security;
alter table public.offer_template_versions enable row level security;
alter table public.talent_messages enable row level security;
alter table public.communication_logs enable row level security;
alter table public.candidate_portal_documents enable row level security;

drop policy if exists talent_pools_workspace_access on public.talent_pools;
create policy talent_pools_workspace_access on public.talent_pools for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists talent_pool_members_workspace_access on public.talent_pool_members;
create policy talent_pool_members_workspace_access on public.talent_pool_members for all
  using (exists (select 1 from public.talent_pools pool where pool.id = pool_id and public.crm_workspace_member(pool.employer_user_id)))
  with check (exists (select 1 from public.talent_pools pool where pool.id = pool_id and public.crm_workspace_member(pool.employer_user_id)));

drop policy if exists employer_contacts_workspace_access on public.employer_contacts;
create policy employer_contacts_workspace_access on public.employer_contacts for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists employee_referrals_workspace_access on public.employee_referrals;
create policy employee_referrals_workspace_access on public.employee_referrals for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists referral_history_workspace_access on public.referral_history;
create policy referral_history_workspace_access on public.referral_history for all
  using (exists (select 1 from public.employee_referrals referral where referral.id = referral_id and public.crm_workspace_member(referral.employer_user_id)))
  with check (exists (select 1 from public.employee_referrals referral where referral.id = referral_id and public.crm_workspace_member(referral.employer_user_id)));

drop policy if exists career_pages_workspace_write on public.career_pages;
create policy career_pages_workspace_write on public.career_pages for all
  using (public.crm_workspace_member(employer_user_id) or is_published)
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists career_events_public_insert on public.career_page_events;
create policy career_events_public_insert on public.career_page_events for insert with check (true);
drop policy if exists career_events_workspace_read on public.career_page_events;
create policy career_events_workspace_read on public.career_page_events for select
  using (exists (select 1 from public.career_pages page where page.id = career_page_id and public.crm_workspace_member(page.employer_user_id)));

drop policy if exists offer_templates_workspace_access on public.offer_templates;
create policy offer_templates_workspace_access on public.offer_templates for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists offer_template_versions_workspace_access on public.offer_template_versions;
create policy offer_template_versions_workspace_access on public.offer_template_versions for all
  using (exists (select 1 from public.offer_templates template where template.id = template_id and public.crm_workspace_member(template.employer_user_id)))
  with check (exists (select 1 from public.offer_templates template where template.id = template_id and public.crm_workspace_member(template.employer_user_id)));

drop policy if exists talent_messages_workspace_access on public.talent_messages;
create policy talent_messages_workspace_access on public.talent_messages for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists communication_logs_workspace_access on public.communication_logs;
create policy communication_logs_workspace_access on public.communication_logs for all
  using (public.crm_workspace_member(employer_user_id))
  with check (public.crm_workspace_member(employer_user_id));

drop policy if exists candidate_portal_documents_owner_access on public.candidate_portal_documents;
create policy candidate_portal_documents_owner_access on public.candidate_portal_documents for all
  using (candidate_user_id = auth.uid() or public.ats_is_admin())
  with check (candidate_user_id = auth.uid() or public.ats_is_admin());
