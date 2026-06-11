-- MXVL Employer Subscriptions
-- Run this after supabase-schema.sql.

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  billing_type text not null default 'recurring',
  job_limit integer,
  candidate_view_limit integer,
  ai_credit_limit integer,
  recruiter_limit integer,
  monthly_price numeric(12, 2),
  yearly_price numeric(12, 2),
  one_time_price numeric(12, 2),
  access_days integer,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_billing_type_check
    check (billing_type in ('one_time', 'recurring', 'custom')),
  constraint subscription_plans_non_negative_limits_check
    check (
      (job_limit is null or job_limit >= 0)
      and (candidate_view_limit is null or candidate_view_limit >= 0)
      and (ai_credit_limit is null or ai_credit_limit >= 0)
      and (recruiter_limit is null or recruiter_limit >= 0)
    ),
  constraint subscription_plans_non_negative_prices_check
    check (
      (monthly_price is null or monthly_price >= 0)
      and (yearly_price is null or yearly_price >= 0)
      and (one_time_price is null or one_time_price >= 0)
    )
);

create table if not exists public.employer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete set null,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'active',
  billing_cycle text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  renews_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_subscriptions_status_check
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  constraint employer_subscriptions_billing_cycle_check
    check (billing_cycle in ('one_time', 'monthly', 'yearly', 'custom')),
  constraint employer_subscriptions_date_order_check
    check (ends_at is null or ends_at >= starts_at),
  constraint employer_subscriptions_cancelled_status_check
    check (cancelled_at is null or status in ('cancelled', 'expired'))
);

create table if not exists public.employer_usage (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers(id) on delete cascade,
  subscription_id uuid not null references public.employer_subscriptions(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  jobs_used integer not null default 0,
  candidate_views_used integer not null default 0,
  ai_credits_used integer not null default 0,
  recruiters_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_usage_period_order_check
    check (period_end > period_start),
  constraint employer_usage_non_negative_check
    check (
      jobs_used >= 0
      and candidate_views_used >= 0
      and ai_credits_used >= 0
      and recruiters_used >= 0
    )
);

create unique index if not exists employer_subscriptions_one_active_per_employer
on public.employer_subscriptions(employer_id)
where status in ('trialing', 'active', 'past_due');

create unique index if not exists employer_usage_subscription_period_unique
on public.employer_usage(subscription_id, period_start, period_end);

create index if not exists employer_subscriptions_employer_id_idx
on public.employer_subscriptions(employer_id);

create index if not exists employer_subscriptions_plan_id_idx
on public.employer_subscriptions(plan_id);

create index if not exists employer_usage_employer_id_idx
on public.employer_usage(employer_id);

create index if not exists employer_usage_subscription_id_idx
on public.employer_usage(subscription_id);

comment on table public.subscription_plans is
'Catalog of MXVL employer subscription plans. Null limit values represent unlimited usage.';

comment on table public.employer_subscriptions is
'Employer subscription records linking employers to subscription_plans.';

comment on table public.employer_usage is
'Per-period employer usage counters for jobs, candidate views, AI credits, and recruiter seats.';

insert into public.subscription_plans (
  slug,
  name,
  description,
  billing_type,
  job_limit,
  candidate_view_limit,
  ai_credit_limit,
  recruiter_limit,
  monthly_price,
  yearly_price,
  one_time_price,
  access_days,
  display_order
)
values
  (
    'one_time',
    'MXVL One-Time Pass',
    'A short hiring sprint for urgent roles.',
    'one_time',
    3,
    20,
    0,
    1,
    null,
    null,
    1500,
    15,
    10
  ),
  (
    'starter',
    'MXVL Starter',
    'For occasional hiring.',
    'recurring',
    3,
    50,
    0,
    1,
    2500,
    24000,
    null,
    null,
    20
  ),
  (
    'growth',
    'MXVL Growth',
    'Built for teams scaling active hiring.',
    'recurring',
    10,
    500,
    100,
    3,
    7500,
    72000,
    null,
    null,
    30
  ),
  (
    'elite',
    'MXVL Elite',
    'Premium AI recruiting for high-volume teams.',
    'recurring',
    null,
    null,
    1000,
    10,
    15000,
    144000,
    null,
    null,
    40
  ),
  (
    'enterprise',
    'MXVL Enterprise',
    'Custom recruitment operating system for large teams.',
    'custom',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    50
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  billing_type = excluded.billing_type,
  job_limit = excluded.job_limit,
  candidate_view_limit = excluded.candidate_view_limit,
  ai_credit_limit = excluded.ai_credit_limit,
  recruiter_limit = excluded.recruiter_limit,
  monthly_price = excluded.monthly_price,
  yearly_price = excluded.yearly_price,
  one_time_price = excluded.one_time_price,
  access_days = excluded.access_days,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

alter table public.subscription_plans enable row level security;
alter table public.employer_subscriptions enable row level security;
alter table public.employer_usage enable row level security;

drop policy if exists "Anyone can read active subscription plans" on public.subscription_plans;
create policy "Anyone can read active subscription plans"
on public.subscription_plans
for select
using (is_active = true);

drop policy if exists "Admins can manage subscription plans" on public.subscription_plans;
create policy "Admins can manage subscription plans"
on public.subscription_plans
for all
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Employers can read own subscriptions" on public.employer_subscriptions;
create policy "Employers can read own subscriptions"
on public.employer_subscriptions
for select
using (
  employer_user_id = auth.uid()
  or exists (
    select 1
    from public.employers
    where employers.id = employer_subscriptions.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage employer subscriptions" on public.employer_subscriptions;
create policy "Admins can manage employer subscriptions"
on public.employer_subscriptions
for all
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

drop policy if exists "Employers can read own usage" on public.employer_usage;
create policy "Employers can read own usage"
on public.employer_usage
for select
using (
  exists (
    select 1
    from public.employers
    where employers.id = employer_usage.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Admins can manage employer usage" on public.employer_usage;
create policy "Admins can manage employer usage"
on public.employer_usage
for all
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
