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

do $$
begin
  if to_regclass('public.notifications') is not null then
    execute 'create index if not exists notifications_user_created_at_idx on public.notifications (user_id, created_at desc)';
  end if;
end
$$;

create index if not exists transactions_status_created_at_idx
  on public.transactions (status, created_at desc);

do $$
declare
  index_target record;
begin
  for index_target in
    select * from (
      values
        ('profiles', 'created_at'),
        ('profiles', 'updated_at'),
        ('profiles', 'status'),
        ('profiles', 'employer_id'),
        ('profiles', 'user_id'),
        ('candidates', 'created_at'),
        ('candidates', 'updated_at'),
        ('candidates', 'status'),
        ('candidates', 'employer_id'),
        ('candidates', 'user_id'),
        ('employers', 'created_at'),
        ('employers', 'updated_at'),
        ('employers', 'status'),
        ('employers', 'employer_id'),
        ('employers', 'user_id'),
        ('employees', 'created_at'),
        ('employees', 'updated_at'),
        ('employees', 'status'),
        ('employees', 'employer_id'),
        ('employees', 'user_id'),
        ('jobs', 'created_at'),
        ('jobs', 'updated_at'),
        ('jobs', 'status'),
        ('jobs', 'employer_id'),
        ('jobs', 'user_id'),
        ('applications', 'created_at'),
        ('applications', 'updated_at'),
        ('applications', 'status'),
        ('applications', 'employer_id'),
        ('applications', 'user_id'),
        ('contact_requests', 'created_at'),
        ('contact_requests', 'updated_at'),
        ('contact_requests', 'status'),
        ('contact_requests', 'employer_id'),
        ('contact_requests', 'user_id'),
        ('hiring_requests', 'created_at'),
        ('hiring_requests', 'updated_at'),
        ('hiring_requests', 'status'),
        ('hiring_requests', 'employer_id'),
        ('hiring_requests', 'user_id'),
        ('transactions', 'created_at'),
        ('transactions', 'updated_at'),
        ('transactions', 'status'),
        ('transactions', 'employer_id'),
        ('transactions', 'user_id'),
        ('subscription_payment_requests', 'created_at'),
        ('subscription_payment_requests', 'updated_at'),
        ('subscription_payment_requests', 'status'),
        ('subscription_payment_requests', 'employer_id'),
        ('subscription_payment_requests', 'user_id'),
        ('employer_subscriptions', 'created_at'),
        ('employer_subscriptions', 'updated_at'),
        ('employer_subscriptions', 'status'),
        ('employer_subscriptions', 'employer_id'),
        ('employer_subscriptions', 'user_id'),
        ('employer_usage', 'created_at'),
        ('employer_usage', 'updated_at'),
        ('employer_usage', 'status'),
        ('employer_usage', 'employer_id'),
        ('employer_usage', 'user_id')
    ) as targets(table_name, column_name)
  loop
    if to_regclass(format('public.%I', index_target.table_name)) is not null
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = index_target.table_name
          and column_name = index_target.column_name
      )
    then
      execute format(
        'create index if not exists %I on public.%I (%I)',
        index_target.table_name || '_' || index_target.column_name || '_admin_idx',
        index_target.table_name,
        index_target.column_name
      );
    end if;
  end loop;
end
$$;
