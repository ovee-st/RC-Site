-- MXVL Sprint 6: Enterprise Recruitment Workflow
-- Run once in the Supabase SQL editor. The migration is additive and idempotent.

create extension if not exists pgcrypto;

create table if not exists public.recruitment_pipelines (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete set null,
  name text not null default 'Default Hiring Pipeline',
  is_default boolean not null default false,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists recruitment_pipelines_default_idx
  on public.recruitment_pipelines (employer_user_id)
  where is_default and not is_archived;

create table if not exists public.recruitment_team_members (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (member_role in ('recruiter','hiring_manager','interviewer')),
  permissions jsonb not null default '{"pipeline":true,"tasks":true,"interviews":true,"offers":false}'::jsonb,
  status text not null default 'active' check (status in ('active','inactive')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employer_user_id, user_id)
);

create index if not exists recruitment_team_members_user_status_idx
  on public.recruitment_team_members (user_id, status);

create table if not exists public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.recruitment_pipelines(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0 check (position >= 0),
  color text not null default '#2563eb',
  is_terminal boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, slug)
);

create index if not exists pipeline_stages_pipeline_position_idx
  on public.pipeline_stages (pipeline_id, is_archived, position);

create table if not exists public.candidate_stages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  pipeline_id uuid not null references public.recruitment_pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  assigned_recruiter_id uuid references auth.users(id) on delete set null,
  tags text[] not null default '{}',
  source text,
  entered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create index if not exists candidate_stages_pipeline_stage_entered_idx
  on public.candidate_stages (pipeline_id, stage_id, entered_at desc);
create index if not exists candidate_stages_recruiter_idx
  on public.candidate_stages (assigned_recruiter_id, updated_at desc);

create or replace function public.ats_pipeline_stage_counts(target_pipeline uuid)
returns table(stage_id uuid, candidate_count bigint)
language sql stable set search_path = public as $$
  select cs.stage_id, count(*)::bigint
  from public.candidate_stages cs
  where cs.pipeline_id = target_pipeline
  group by cs.stage_id;
$$;

create table if not exists public.application_timeline_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  pipeline_id uuid references public.recruitment_pipelines(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists application_timeline_application_created_idx
  on public.application_timeline_events (application_id, created_at desc);
create index if not exists application_timeline_pipeline_created_idx
  on public.application_timeline_events (pipeline_id, created_at desc);

create or replace function public.prevent_ats_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'ATS audit records are immutable';
end;
$$;

drop trigger if exists application_timeline_immutable on public.application_timeline_events;
create trigger application_timeline_immutable
before update or delete on public.application_timeline_events
for each row execute function public.prevent_ats_audit_mutation();

create table if not exists public.recruiter_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  body jsonb not null default '{}'::jsonb,
  plain_text text not null default '',
  mentions uuid[] not null default '{}',
  tags text[] not null default '{}',
  current_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruiter_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.recruiter_notes(id) on delete cascade,
  version integer not null,
  body jsonb not null,
  plain_text text not null,
  edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (note_id, version)
);

create table if not exists public.recruitment_attachments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  note_id uuid references public.recruiter_notes(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  check (application_id is not null or note_id is not null)
);

create table if not exists public.recruitment_tasks (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  description text,
  task_type text not null default 'general',
  status text not null default 'pending' check (status in ('pending','in_progress','completed','overdue')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruitment_tasks_owner_status_due_idx
  on public.recruitment_tasks (employer_user_id, status, due_at);
create index if not exists recruitment_tasks_assignee_idx
  on public.recruitment_tasks (assigned_to, status, due_at);

create table if not exists public.recruitment_interviews (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  interview_type text not null check (interview_type in ('phone','video','onsite','panel','technical','hr','final')),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','rescheduled')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 45 check (duration_minutes between 5 and 480),
  timezone text not null default 'Asia/Dhaka',
  agenda text,
  meeting_link text,
  location text,
  notes text,
  rescheduled_from uuid references public.recruitment_interviews(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruitment_interviews_owner_schedule_idx
  on public.recruitment_interviews (employer_user_id, status, scheduled_at);

create table if not exists public.interview_participants (
  interview_id uuid not null references public.recruitment_interviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  participant_role text not null default 'interviewer',
  response_status text not null default 'pending',
  primary key (interview_id, user_id)
);

create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.recruitment_interviews(id) on delete cascade,
  interviewer_id uuid not null references auth.users(id) on delete restrict,
  communication smallint check (communication between 1 and 5),
  technical smallint check (technical between 1 and 5),
  leadership smallint check (leadership between 1 and 5),
  problem_solving smallint check (problem_solving between 1 and 5),
  culture_fit smallint check (culture_fit between 1 and 5),
  experience smallint check (experience between 1 and 5),
  overall smallint check (overall between 1 and 5),
  recommendation text,
  comments text,
  submitted_at timestamptz not null default now(),
  unique (interview_id, interviewer_id)
);

create table if not exists public.recruitment_assessments (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  title text not null,
  provider text not null default 'manual',
  external_reference text,
  status text not null default 'assigned' check (status in ('assigned','started','completed','expired')),
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  score numeric,
  feedback text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruitment_assessments_owner_status_idx
  on public.recruitment_assessments (employer_user_id, status, updated_at desc);

create table if not exists public.recruitment_offers (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','internal_approval','sent','viewed','accepted','declined','expired','withdrawn')),
  current_version integer not null default 1,
  expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create table if not exists public.recruitment_offer_versions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.recruitment_offers(id) on delete cascade,
  version integer not null,
  title text not null,
  currency text not null default 'BDT',
  salary numeric,
  joining_date date,
  terms jsonb not null default '{}'::jsonb,
  message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (offer_id, version)
);

create table if not exists public.workflow_automation_rules (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.recruitment_pipelines(id) on delete cascade,
  name text not null,
  trigger_event text not null check (trigger_event in ('stage_entered','offer_accepted','assessment_completed')),
  trigger_config jsonb not null default '{}'::jsonb,
  action_type text not null check (action_type in ('create_task','move_stage','notify_recruiter')),
  action_config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recruitment_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recruitment_notifications_user_unread_idx
  on public.recruitment_notifications (user_id, created_at desc) where read_at is null;

create table if not exists public.recruitment_communications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  communication_type text not null check (communication_type in ('email','interview_invitation','sms','note','system')),
  direction text not null default 'internal' check (direction in ('inbound','outbound','internal')),
  subject text,
  body text,
  actor_id uuid references auth.users(id) on delete set null,
  recipient_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recruitment_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  pipeline_id uuid references public.recruitment_pipelines(id) on delete cascade,
  snapshot_date date not null default current_date,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (employer_user_id, pipeline_id, snapshot_date)
);

create or replace function public.ats_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and lower(coalesce(role, '')) in ('admin','viewer')
  );
$$;

create or replace function public.ats_owns_application(target_application uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.applications a
    left join public.employers e on e.id = a.employer_id
    where a.id = target_application
      and (
        a.employer_user_id = auth.uid()
        or e.user_id = auth.uid()
        or exists (
          select 1 from public.recruitment_team_members m
          where m.user_id = auth.uid() and m.status = 'active'
            and m.employer_user_id = coalesce(a.employer_user_id, e.user_id)
        )
        or public.ats_is_admin()
      )
  );
$$;

alter table public.recruitment_pipelines enable row level security;
alter table public.recruitment_team_members enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.candidate_stages enable row level security;
alter table public.application_timeline_events enable row level security;
alter table public.recruiter_notes enable row level security;
alter table public.recruiter_note_versions enable row level security;
alter table public.recruitment_attachments enable row level security;
alter table public.recruitment_tasks enable row level security;
alter table public.recruitment_interviews enable row level security;
alter table public.interview_participants enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.recruitment_assessments enable row level security;
alter table public.recruitment_offers enable row level security;
alter table public.recruitment_offer_versions enable row level security;
alter table public.workflow_automation_rules enable row level security;
alter table public.recruitment_notifications enable row level security;
alter table public.recruitment_communications enable row level security;
alter table public.recruitment_analytics_snapshots enable row level security;

drop policy if exists "ATS owners manage pipelines" on public.recruitment_pipelines;
create policy "ATS owners manage pipelines" on public.recruitment_pipelines for all
  using (employer_user_id = auth.uid() or exists (select 1 from public.recruitment_team_members m where m.employer_user_id = recruitment_pipelines.employer_user_id and m.user_id = auth.uid() and m.status = 'active') or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());

drop policy if exists "Employers manage recruitment team" on public.recruitment_team_members;
create policy "Employers manage recruitment team" on public.recruitment_team_members for all
  using (employer_user_id = auth.uid() or user_id = auth.uid() or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());

drop policy if exists "ATS owners manage stages" on public.pipeline_stages;
create policy "ATS owners manage stages" on public.pipeline_stages for all
  using (exists (select 1 from public.recruitment_pipelines p where p.id = pipeline_id and (p.employer_user_id = auth.uid() or public.ats_is_admin())))
  with check (exists (select 1 from public.recruitment_pipelines p where p.id = pipeline_id and (p.employer_user_id = auth.uid() or public.ats_is_admin())));

drop policy if exists "ATS owners manage candidate stages" on public.candidate_stages;
create policy "ATS owners manage candidate stages" on public.candidate_stages for all
  using (public.ats_owns_application(application_id)) with check (public.ats_owns_application(application_id));

drop policy if exists "ATS owners read timeline" on public.application_timeline_events;
create policy "ATS owners read timeline" on public.application_timeline_events for select
  using (public.ats_owns_application(application_id));
drop policy if exists "ATS owners append timeline" on public.application_timeline_events;
create policy "ATS owners append timeline" on public.application_timeline_events for insert
  with check (public.ats_owns_application(application_id));

drop policy if exists "ATS owners manage notes" on public.recruiter_notes;
create policy "ATS owners manage notes" on public.recruiter_notes for all
  using (public.ats_owns_application(application_id)) with check (public.ats_owns_application(application_id));
drop policy if exists "ATS owners read note versions" on public.recruiter_note_versions;
create policy "ATS owners read note versions" on public.recruiter_note_versions for select
  using (exists (select 1 from public.recruiter_notes n where n.id = note_id and public.ats_owns_application(n.application_id)));
drop policy if exists "ATS owners add note versions" on public.recruiter_note_versions;
create policy "ATS owners add note versions" on public.recruiter_note_versions for insert
  with check (exists (select 1 from public.recruiter_notes n where n.id = note_id and public.ats_owns_application(n.application_id)));

drop policy if exists "ATS owners manage attachments" on public.recruitment_attachments;
create policy "ATS owners manage attachments" on public.recruitment_attachments for all
  using (application_id is not null and public.ats_owns_application(application_id))
  with check (application_id is not null and public.ats_owns_application(application_id));

drop policy if exists "ATS owners manage tasks" on public.recruitment_tasks;
create policy "ATS owners manage tasks" on public.recruitment_tasks for all
  using (employer_user_id = auth.uid() or assigned_to = auth.uid() or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());

drop policy if exists "ATS participants manage interviews" on public.recruitment_interviews;
create policy "ATS participants manage interviews" on public.recruitment_interviews for all
  using (employer_user_id = auth.uid() or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());
drop policy if exists "Interview participants read" on public.interview_participants;
create policy "Interview participants read" on public.interview_participants for select
  using (user_id = auth.uid() or exists (select 1 from public.recruitment_interviews i where i.id = interview_id and (i.employer_user_id = auth.uid() or public.ats_is_admin())));
drop policy if exists "Interview owners manage participants" on public.interview_participants;
create policy "Interview owners manage participants" on public.interview_participants for all
  using (exists (select 1 from public.recruitment_interviews i where i.id = interview_id and (i.employer_user_id = auth.uid() or public.ats_is_admin())))
  with check (exists (select 1 from public.recruitment_interviews i where i.id = interview_id and (i.employer_user_id = auth.uid() or public.ats_is_admin())));
drop policy if exists "Interviewers manage own feedback" on public.interview_feedback;
create policy "Interviewers manage own feedback" on public.interview_feedback for all
  using (interviewer_id = auth.uid() or public.ats_is_admin())
  with check (interviewer_id = auth.uid() or public.ats_is_admin());

drop policy if exists "ATS owners manage assessments" on public.recruitment_assessments;
create policy "ATS owners manage assessments" on public.recruitment_assessments for all
  using (employer_user_id = auth.uid() or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());
drop policy if exists "ATS owners manage offers" on public.recruitment_offers;
create policy "ATS owners manage offers" on public.recruitment_offers for all
  using (employer_user_id = auth.uid() or public.ats_is_admin())
  with check (employer_user_id = auth.uid() or public.ats_is_admin());
drop policy if exists "ATS owners manage offer versions" on public.recruitment_offer_versions;
create policy "ATS owners manage offer versions" on public.recruitment_offer_versions for all
  using (exists (select 1 from public.recruitment_offers o where o.id = offer_id and (o.employer_user_id = auth.uid() or public.ats_is_admin())))
  with check (exists (select 1 from public.recruitment_offers o where o.id = offer_id and (o.employer_user_id = auth.uid() or public.ats_is_admin())));

drop policy if exists "ATS owners manage automations" on public.workflow_automation_rules;
create policy "ATS owners manage automations" on public.workflow_automation_rules for all
  using (exists (select 1 from public.recruitment_pipelines p where p.id = pipeline_id and (p.employer_user_id = auth.uid() or public.ats_is_admin())))
  with check (exists (select 1 from public.recruitment_pipelines p where p.id = pipeline_id and (p.employer_user_id = auth.uid() or public.ats_is_admin())));
drop policy if exists "Users read workflow notifications" on public.recruitment_notifications;
create policy "Users read workflow notifications" on public.recruitment_notifications for select using (user_id = auth.uid() or public.ats_is_admin());
drop policy if exists "Users update workflow notifications" on public.recruitment_notifications;
create policy "Users update workflow notifications" on public.recruitment_notifications for update using (user_id = auth.uid() or public.ats_is_admin());
drop policy if exists "ATS owners manage communications" on public.recruitment_communications;
create policy "ATS owners manage communications" on public.recruitment_communications for all
  using (public.ats_owns_application(application_id)) with check (public.ats_owns_application(application_id));
drop policy if exists "ATS owners read analytics" on public.recruitment_analytics_snapshots;
create policy "ATS owners read analytics" on public.recruitment_analytics_snapshots for select
  using (employer_user_id = auth.uid() or public.ats_is_admin());

grant execute on function public.ats_is_admin() to authenticated;
grant execute on function public.ats_owns_application(uuid) to authenticated;
grant execute on function public.ats_pipeline_stage_counts(uuid) to authenticated;
