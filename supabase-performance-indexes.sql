-- Idempotent indexes for the admin, subscription, dashboard, and notification read paths.
create index if not exists profiles_role_created_at_idx
  on public.profiles (role, created_at desc);

create index if not exists candidates_user_id_idx
  on public.candidates (user_id);

create index if not exists employers_user_id_idx
  on public.employers (user_id);

create index if not exists jobs_employer_created_at_idx
  on public.jobs (employer_id, created_at desc);

create index if not exists jobs_status_created_at_idx
  on public.jobs (status, created_at desc);

create index if not exists applications_job_created_at_idx
  on public.applications (job_id, created_at desc);

create index if not exists applications_candidate_created_at_idx
  on public.applications (candidate_id, created_at desc);

create index if not exists employer_subscriptions_current_idx
  on public.employer_subscriptions (employer_id, status, updated_at desc, starts_at desc);

create index if not exists employer_subscriptions_user_current_idx
  on public.employer_subscriptions (employer_user_id, status, updated_at desc);

create index if not exists employer_usage_current_period_idx
  on public.employer_usage (subscription_id, period_start desc, period_end);

create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists transactions_status_created_at_idx
  on public.transactions (status, created_at desc);
