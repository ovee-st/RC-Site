create table if not exists public.candidate_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  analysis_type text not null,
  prompt_version text not null,
  model text not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.candidate_ai_timeline (
  id text primary key,
  candidate_id uuid not null,
  created_by uuid references auth.users(id) on delete set null,
  event text not null,
  timestamp timestamptz not null default now(),
  actor_type text not null check (actor_type in ('system', 'ai', 'human')),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.candidate_ai_decision_audit (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null,
  job_id uuid,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  prompt_version text not null,
  model text not null,
  confidence integer not null check (confidence between 0 and 100),
  evidence_references jsonb not null default '[]'::jsonb,
  unknowns jsonb not null default '[]'::jsonb,
  human_action text,
  created_at timestamptz not null default now()
);

create index if not exists candidate_ai_analyses_candidate_created_idx on public.candidate_ai_analyses(candidate_id, created_at desc);
create index if not exists candidate_ai_timeline_candidate_timestamp_idx on public.candidate_ai_timeline(candidate_id, timestamp desc);
create index if not exists candidate_ai_audit_candidate_created_idx on public.candidate_ai_decision_audit(candidate_id, created_at desc);
create index if not exists candidate_ai_audit_job_created_idx on public.candidate_ai_decision_audit(job_id, created_at desc);

alter table public.candidate_ai_analyses enable row level security;
alter table public.candidate_ai_timeline enable row level security;
alter table public.candidate_ai_decision_audit enable row level security;

create or replace function public.prevent_candidate_ai_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Candidate AI audit records are immutable';
end;
$$;

drop trigger if exists candidate_ai_analyses_immutable on public.candidate_ai_analyses;
create trigger candidate_ai_analyses_immutable before update or delete on public.candidate_ai_analyses for each row execute function public.prevent_candidate_ai_mutation();
drop trigger if exists candidate_ai_timeline_immutable on public.candidate_ai_timeline;
create trigger candidate_ai_timeline_immutable before update or delete on public.candidate_ai_timeline for each row execute function public.prevent_candidate_ai_mutation();
drop trigger if exists candidate_ai_audit_immutable on public.candidate_ai_decision_audit;
create trigger candidate_ai_audit_immutable before update or delete on public.candidate_ai_decision_audit for each row execute function public.prevent_candidate_ai_mutation();
