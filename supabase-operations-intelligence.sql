-- MXVL Sprint 10: operations intelligence and private beta control plane.
-- Additive, idempotent, and service-role only. Run after platform hardening.

create extension if not exists pgcrypto;

create table if not exists public.platform_product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  page_path text,
  role text,
  session_id text,
  duration_ms integer,
  completed boolean,
  correlation_id text,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists platform_product_events_name_time_idx on public.platform_product_events (event_name, occurred_at desc);
create index if not exists platform_product_events_user_time_idx on public.platform_product_events (user_id, occurred_at desc) where user_id is not null;
create index if not exists platform_product_events_session_time_idx on public.platform_product_events (session_id, occurred_at desc) where session_id is not null;

create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  email text,
  intended_role text,
  status text not null default 'pending' check (status in ('pending','approved','used','expired','revoked')),
  expires_at timestamptz,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists beta_invites_status_created_idx on public.beta_invites (status, created_at desc);
create index if not exists beta_invites_expiry_idx on public.beta_invites (expires_at) where expires_at is not null;

create table if not exists public.beta_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  requested_role text,
  company_name text,
  status text not null default 'waiting' check (status in ('waiting','approved','invited','declined')),
  source text,
  notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists beta_waitlist_status_created_idx on public.beta_waitlist (status, created_at desc);

create table if not exists public.beta_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  invite_id uuid references public.beta_invites(id) on delete set null,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  early_access boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists beta_memberships_status_expiry_idx on public.beta_memberships (status, expires_at);

create table if not exists public.beta_configuration (
  id boolean primary key default true check (id),
  invite_only boolean not null default false,
  waitlist_enabled boolean not null default true,
  beta_ends_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.beta_configuration (id) values (true) on conflict (id) do nothing;

create table if not exists public.platform_errors (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('client','server','api','background_job','ai','database')),
  severity text not null default 'error' check (severity in ('info','warning','error','critical')),
  error_code text,
  message text not null,
  route text,
  user_id uuid references auth.users(id) on delete set null,
  correlation_id text,
  fingerprint text,
  context jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists platform_errors_severity_created_idx on public.platform_errors (severity, created_at desc);
create index if not exists platform_errors_unresolved_idx on public.platform_errors (created_at desc) where resolved_at is null;
create index if not exists platform_errors_correlation_idx on public.platform_errors (correlation_id) where correlation_id is not null;

create table if not exists public.platform_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  title text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  source text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists platform_notifications_status_created_idx on public.platform_notifications (status, created_at desc);

create table if not exists public.platform_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  summary text not null,
  release_type text not null default 'product_update' check (release_type in ('product_update','release_note','maintenance')),
  status text not null default 'draft' check (status in ('draft','scheduled','published','completed','cancelled')),
  banner_message text,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_releases_status_schedule_idx on public.platform_releases (status, starts_at, ends_at);

create table if not exists public.feedback_hub (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feedback_type text not null default 'general' check (feedback_type in ('idea','bug','feature_request','general','satisfaction')),
  category text,
  rating smallint check (rating between 1 and 5),
  title text,
  message text not null,
  page_path text,
  role text,
  status text not null default 'new' check (status in ('new','reviewing','planned','resolved','closed')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists feedback_hub_status_priority_idx on public.feedback_hub (status, priority, created_at desc);
create index if not exists feedback_hub_type_created_idx on public.feedback_hub (feedback_type, created_at desc);

alter table public.platform_product_events enable row level security;
alter table public.beta_invites enable row level security;
alter table public.beta_waitlist enable row level security;
alter table public.beta_memberships enable row level security;
alter table public.beta_configuration enable row level security;
alter table public.platform_errors enable row level security;
alter table public.platform_notifications enable row level security;
alter table public.platform_releases enable row level security;
alter table public.feedback_hub enable row level security;

-- Operational records are read and written through secured service-role APIs.
-- No authenticated or anonymous policies are intentionally created.

create or replace function public.operations_prevent_immutable_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Operational audit and event records are immutable';
end;
$$;

drop trigger if exists platform_product_events_immutable on public.platform_product_events;
create trigger platform_product_events_immutable
before update or delete on public.platform_product_events
for each row execute function public.operations_prevent_immutable_mutation();

drop trigger if exists platform_audit_logs_immutable on public.platform_audit_logs;
create trigger platform_audit_logs_immutable
before update or delete on public.platform_audit_logs
for each row execute function public.operations_prevent_immutable_mutation();
