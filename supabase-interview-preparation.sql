create extension if not exists pgcrypto;

create table if not exists public.interview_preparation_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  job_id uuid not null references public.jobs(id) on delete cascade,
  mode text not null default 'basic' check (mode in ('basic', 'mock')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  is_pro boolean not null default false,
  question_limit integer,
  current_question integer not null default 0,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  strengths text[] not null default '{}',
  missing_skills text[] not null default '{}',
  improvement_areas text[] not null default '{}',
  questions jsonb not null default '[]'::jsonb,
  report_data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interview_preparation_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_preparation_sessions(id) on delete cascade,
  question_id text not null,
  answer text not null,
  ai_score integer check (ai_score between 0 and 100),
  feedback text,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create index if not exists interview_prep_candidate_job_idx
  on public.interview_preparation_sessions(candidate_user_id, job_id, created_at desc);
create index if not exists interview_prep_application_idx
  on public.interview_preparation_sessions(application_id);
create index if not exists interview_prep_responses_session_idx
  on public.interview_preparation_responses(session_id, created_at);

alter table public.interview_preparation_sessions enable row level security;
alter table public.interview_preparation_responses enable row level security;

drop policy if exists "Candidates manage own interview preparation" on public.interview_preparation_sessions;
create policy "Candidates manage own interview preparation"
  on public.interview_preparation_sessions
  for all
  using (auth.uid() = candidate_user_id)
  with check (auth.uid() = candidate_user_id);

drop policy if exists "Candidates manage own interview responses" on public.interview_preparation_responses;
create policy "Candidates manage own interview responses"
  on public.interview_preparation_responses
  for all
  using (
    exists (
      select 1 from public.interview_preparation_sessions session
      where session.id = session_id and session.candidate_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interview_preparation_sessions session
      where session.id = session_id and session.candidate_user_id = auth.uid()
    )
  );

comment on table public.interview_preparation_sessions is 'Job-specific candidate interview preparation and progress.';
comment on table public.interview_preparation_responses is 'Candidate mock interview answers and AI feedback.';
