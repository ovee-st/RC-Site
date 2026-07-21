-- MXVL Sprint 7.5: production hardening infrastructure.
-- Additive and idempotent. Run after Sprint 6 and Sprint 7 migrations.

create extension if not exists pgcrypto;

create table if not exists public.platform_background_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','completed','retrying','dead_letter','cancelled')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 10),
  progress smallint not null default 0 check (progress between 0 and 100),
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  correlation_id text,
  locked_by text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_jobs_queue_idx on public.platform_background_jobs (status, scheduled_at) where status in ('queued','retrying');
create index if not exists platform_jobs_correlation_idx on public.platform_background_jobs (correlation_id) where correlation_id is not null;

create table if not exists public.ai_observability_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  task text not null,
  model text not null,
  latency_ms integer not null default 0,
  success boolean not null,
  fallback_used boolean not null default false,
  confidence numeric,
  prompt_version text not null default 'v1',
  input_tokens integer,
  output_tokens integer,
  cache_hit boolean not null default false,
  human_override boolean not null default false,
  error_code text,
  correlation_id text,
  created_at timestamptz not null default now()
);
create index if not exists ai_observability_task_created_idx on public.ai_observability_events (task, created_at desc);
create index if not exists ai_observability_failures_idx on public.ai_observability_events (created_at desc) where not success;

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  outcome text not null default 'success',
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists platform_audit_actor_created_idx on public.platform_audit_logs (actor_id, created_at desc);
create index if not exists platform_audit_resource_idx on public.platform_audit_logs (resource_type, resource_id, created_at desc);

alter table public.platform_background_jobs enable row level security;
alter table public.ai_observability_events enable row level security;
alter table public.platform_audit_logs enable row level security;

-- Operational tables are service-role only. No authenticated/public policies are created.

create index if not exists applications_employer_created_idx on public.applications (employer_user_id, created_at desc);
create index if not exists applications_candidate_created_idx on public.applications (candidate_user_id, created_at desc);
create index if not exists jobs_employer_status_created_idx on public.jobs (employer_user_id, status, created_at desc);
create index if not exists recruitment_offers_owner_status_idx on public.recruitment_offers (employer_user_id, status, updated_at desc);
create index if not exists recruitment_messages_application_created_idx on public.recruitment_communications (application_id, created_at desc);
