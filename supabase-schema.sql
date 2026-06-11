-- Run this in the Supabase SQL Editor before using the site forms.
-- Replace broad public insert policies later if you add authentication or server-side validation.

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  full_name text not null,
  phone_number text not null,
  email text not null,
  location text not null,
  photo_url text,
  category text,
  categories text[],
  education text not null,
  education_json jsonb not null default '[]'::jsonb,
  skills text not null,
  skills_array text[],
  other_skills text,
  experience text not null,
  experience_json jsonb not null default '[]'::jsonb,
  certifications jsonb not null default '[]'::jsonb,
  about text,
  current_salary numeric,
  expected_salary numeric,
  career_level text,
  target_role text,
  resume_path text,
  resume_url text
);

create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  company_name text not null,
  contact_person text not null,
  email text,
  phone text,
  location text,
  industry text,
  company_size text,
  about text,
  contact_number text not null,
  official_email text not null,
  monthly_needed_hiring integer not null,
  plan_interest text not null,
  category text,
  role_needed text,
  required_skills text,
  number_of_positions integer,
  salary_range text,
  talent_categories_role_requirements text not null
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  full_name text not null,
  role text not null check (role in ('candidate', 'employer'))
);

create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  role_needed text,
  required_skills text not null,
  location text not null,
  job_type text not null,
  description text not null,
  status text not null default 'active'
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  job_title text not null,
  job_location text,
  job_type text,
  job_level text,
  employment_type text,
  category text not null,
  role text,
  description text,
  requirements text,
  required_skills text not null,
  required_skills_array text[],
  experience_level text,
  salary_range text,
  salary_min numeric,
  salary_max numeric,
  salary_hidden boolean not null default false,
  benefits text,
  last_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  candidate_user_id uuid references auth.users(id) on delete cascade,
  candidate_id uuid references auth.users(id) on delete cascade,
  employer_id uuid references public.employers(id) on delete cascade,
  employer_user_id uuid references auth.users(id) on delete cascade,
  job_post_id uuid references public.job_posts(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  job_role text,
  cv_url text,
  status text not null default 'Applied',
  unique (candidate_id, employer_id, job_role),
  unique (candidate_user_id, job_post_id)
);

create table if not exists public.hiring_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  hiring_type text,
  roles text,
  quantity text,
  company_name text not null,
  contact_person text,
  email text,
  phone text,
  hiring_category text not null,
  number_of_employees integer not null,
  job_roles text not null,
  location text not null,
  budget text not null,
  timeline text not null
);

alter table public.candidates add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.candidates add column if not exists name text;
alter table public.candidates add column if not exists photo_url text;
alter table public.candidates add column if not exists category text;
alter table public.candidates add column if not exists categories text[];
alter table public.candidates add column if not exists target_role text;
alter table public.candidates add column if not exists skills_array text[];
alter table public.candidates add column if not exists other_skills text;
alter table public.candidates add column if not exists education_json jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists experience_json jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists certifications jsonb not null default '[]'::jsonb;
alter table public.candidates add column if not exists about text;
alter table public.candidates add column if not exists current_salary numeric;
alter table public.candidates add column if not exists expected_salary numeric;
alter table public.candidates add column if not exists career_level text;
alter table public.employers add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.employers add column if not exists email text;
alter table public.employers add column if not exists phone text;
alter table public.employers add column if not exists location text;
alter table public.employers add column if not exists industry text;
alter table public.employers add column if not exists company_size text;
alter table public.employers add column if not exists about text;
alter table public.employers add column if not exists category text;
alter table public.employers add column if not exists role_needed text;
alter table public.employers add column if not exists required_skills text;
alter table public.employers add column if not exists number_of_positions integer;
alter table public.employers add column if not exists salary_range text;
alter table public.job_posts add column if not exists role_needed text;
alter table public.jobs add column if not exists employer_id uuid references auth.users(id) on delete cascade;
alter table public.jobs add column if not exists company_name text;
alter table public.jobs add column if not exists job_title text;
alter table public.jobs add column if not exists job_location text;
alter table public.jobs add column if not exists job_type text;
alter table public.jobs add column if not exists job_level text;
alter table public.jobs add column if not exists employment_type text;
alter table public.jobs add column if not exists category text;
alter table public.jobs add column if not exists role text;
alter table public.jobs alter column role drop not null;
alter table public.jobs add column if not exists description text;
alter table public.jobs add column if not exists requirements text;
alter table public.jobs add column if not exists required_skills text;
alter table public.jobs add column if not exists required_skills_array text[];
alter table public.jobs add column if not exists experience_level text;
alter table public.jobs add column if not exists salary_range text;
alter table public.jobs add column if not exists salary_min numeric;
alter table public.jobs add column if not exists salary_max numeric;
alter table public.jobs add column if not exists salary_hidden boolean not null default false;
alter table public.jobs add column if not exists benefits text;
alter table public.jobs add column if not exists last_date date;
alter table public.jobs add column if not exists status text not null default 'active';
alter table public.applications alter column candidate_user_id drop not null;
alter table public.applications alter column job_post_id drop not null;
alter table public.applications add column if not exists candidate_id uuid references auth.users(id) on delete cascade;
alter table public.applications add column if not exists employer_id uuid references public.employers(id) on delete cascade;
alter table public.applications add column if not exists employer_user_id uuid references auth.users(id) on delete cascade;
alter table public.applications add column if not exists job_id uuid references public.jobs(id) on delete cascade;
alter table public.applications add column if not exists job_role text;
alter table public.applications add column if not exists cv_url text;
alter table public.hiring_requests add column if not exists company_name text;
alter table public.hiring_requests add column if not exists hiring_type text;
alter table public.hiring_requests add column if not exists roles text;
alter table public.hiring_requests add column if not exists quantity text;
alter table public.hiring_requests add column if not exists contact_person text;
alter table public.hiring_requests add column if not exists email text;
alter table public.hiring_requests add column if not exists phone text;
alter table public.hiring_requests add column if not exists hiring_category text;
alter table public.hiring_requests add column if not exists number_of_employees integer;
alter table public.hiring_requests add column if not exists job_roles text;
alter table public.hiring_requests add column if not exists location text;
alter table public.hiring_requests add column if not exists budget text;
alter table public.hiring_requests add column if not exists timeline text;

create unique index if not exists candidates_user_id_unique
on public.candidates(user_id)
where user_id is not null;

create unique index if not exists applications_candidate_job_unique
on public.applications(candidate_id, job_id)
where candidate_id is not null and job_id is not null;

alter table public.candidates enable row level security;
alter table public.employers enable row level security;
alter table public.profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.hiring_requests enable row level security;

drop policy if exists "Anyone can submit hiring requests" on public.hiring_requests;
create policy "Anyone can submit hiring requests"
on public.hiring_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Allow public candidate submissions" on public.candidates;
create policy "Allow public candidate submissions"
on public.candidates
for insert
to anon
with check (true);

drop policy if exists "Authenticated users can read candidates" on public.candidates;
create policy "Authenticated users can read candidates"
on public.candidates
for select
to authenticated
using (true);

drop policy if exists "Candidates can upsert own profile" on public.candidates;
create policy "Candidates can upsert own profile"
on public.candidates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Candidates can update own profile" on public.candidates;
create policy "Candidates can update own profile"
on public.candidates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Allow public employer submissions" on public.employers;
create policy "Allow public employer submissions"
on public.employers
for insert
to anon
with check (true);

drop policy if exists "Employers can manage own company request" on public.employers;
create policy "Employers can manage own company request"
on public.employers
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can read employer requirements" on public.employers;
create policy "Authenticated users can read employer requirements"
on public.employers
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read active job posts" on public.job_posts;
create policy "Authenticated users can read active job posts"
on public.job_posts
for select
to authenticated
using (status = 'active' or auth.uid() = employer_user_id);

drop policy if exists "Employers can create job posts" on public.job_posts;
create policy "Employers can create job posts"
on public.job_posts
for insert
to authenticated
with check (auth.uid() = employer_user_id);

drop policy if exists "Employers can update own job posts" on public.job_posts;
create policy "Employers can update own job posts"
on public.job_posts
for update
to authenticated
using (auth.uid() = employer_user_id)
with check (auth.uid() = employer_user_id);

drop policy if exists "Authenticated users can read jobs" on public.jobs;
create policy "Authenticated users can read jobs"
on public.jobs
for select
to anon, authenticated
using (true);

drop policy if exists "Employers can create jobs" on public.jobs;
create policy "Employers can create jobs"
on public.jobs
for insert
to authenticated
with check (auth.uid() = employer_id);

drop policy if exists "Employers can update own jobs" on public.jobs;
create policy "Employers can update own jobs"
on public.jobs
for update
to authenticated
using (auth.uid() = employer_id)
with check (auth.uid() = employer_id);

drop policy if exists "Employers can delete own jobs" on public.jobs;
create policy "Employers can delete own jobs"
on public.jobs
for delete
to authenticated
using (auth.uid() = employer_id);

drop policy if exists "Candidates can manage own applications" on public.applications;
create policy "Candidates can manage own applications"
on public.applications
for all
to authenticated
using (auth.uid() = candidate_user_id or auth.uid() = candidate_id)
with check (auth.uid() = candidate_user_id or auth.uid() = candidate_id);

drop policy if exists "Employers can read own applications" on public.applications;
create policy "Employers can read own applications"
on public.applications
for select
to authenticated
using (
  auth.uid() = applications.employer_user_id
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.employer_id = auth.uid()
  )
  or
  exists (
    select 1 from public.employers
    where employers.id = applications.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Employers can update own applications" on public.applications;
create policy "Employers can update own applications"
on public.applications
for update
to authenticated
using (
  auth.uid() = applications.employer_user_id
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.employer_id = auth.uid()
  )
  or
  exists (
    select 1 from public.employers
    where employers.id = applications.employer_id
    and employers.user_id = auth.uid()
  )
)
with check (
  auth.uid() = applications.employer_user_id
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.employer_id = auth.uid()
  )
  or
  exists (
    select 1 from public.employers
    where employers.id = applications.employer_id
    and employers.user_id = auth.uid()
  )
);

drop policy if exists "Employers can create shortlist applications" on public.applications;
create policy "Employers can create shortlist applications"
on public.applications
for insert
to authenticated
with check (
  auth.uid() = applications.employer_user_id
  or exists (
    select 1 from public.jobs
    where jobs.id = applications.job_id
    and jobs.employer_id = auth.uid()
  )
  or
  exists (
    select 1 from public.employers
    where employers.id = applications.employer_id
    and employers.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('candidate-resumes', 'candidate-resumes', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', true)
on conflict (id) do nothing;

drop policy if exists "Allow public resume uploads" on storage.objects;
create policy "Allow public resume uploads"
on storage.objects
for insert
to anon
with check (bucket_id = 'candidate-resumes');

drop policy if exists "Allow public resume reads" on storage.objects;
create policy "Allow public resume reads"
on storage.objects
for select
to anon
using (bucket_id = 'candidate-resumes');

drop policy if exists "Allow authenticated profile photo uploads" on storage.objects;
create policy "Allow authenticated profile photo uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'profile-photos');

drop policy if exists "Allow authenticated profile photo updates" on storage.objects;
create policy "Allow authenticated profile photo updates"
on storage.objects
for update
to authenticated
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

drop policy if exists "Allow public profile photo reads" on storage.objects;
create policy "Allow public profile photo reads"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'profile-photos');

drop policy if exists "Allow authenticated CV uploads" on storage.objects;
create policy "Allow authenticated CV uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'cvs');

drop policy if exists "Allow authenticated CV updates" on storage.objects;
create policy "Allow authenticated CV updates"
on storage.objects
for update
to authenticated
using (bucket_id = 'cvs')
with check (bucket_id = 'cvs');

drop policy if exists "Allow CV reads" on storage.objects;
create policy "Allow CV reads"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'cvs');

-- Super admin support
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('candidate', 'employer', 'admin', 'viewer'));

alter table public.profiles add column if not exists plan text default 'Basic';
alter table public.profiles add column if not exists verified boolean not null default false;
alter table public.candidates add column if not exists plan text default 'Basic';
alter table public.candidates add column if not exists verified boolean not null default false;
alter table public.employers add column if not exists verified boolean not null default false;

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  phone text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'in progress', 'resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  coupon_name text,
  code text unique not null,
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  discount_percentage integer not null check (discount_percentage between 1 and 100),
  discount_amount numeric(12, 2),
  active boolean not null default true,
  usage_limit integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons add column if not exists coupon_name text;
alter table public.coupons add column if not exists discount_type text not null default 'percentage';
alter table public.coupons add column if not exists discount_amount numeric(12, 2);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  amount numeric not null default 0,
  payment_method text,
  coupon_used text,
  transaction_id text unique,
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

alter table public.contact_requests enable row level security;
alter table public.coupons enable row level security;
alter table public.transactions enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.is_admin_or_viewer()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'viewer')
  );
$$;

drop policy if exists "Admins and viewers can read profiles" on public.profiles;
create policy "Admins and viewers can read profiles"
on public.profiles
for select
to authenticated
using (public.is_admin_or_viewer());

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins and viewers can read candidates" on public.candidates;
create policy "Admins and viewers can read candidates"
on public.candidates
for select
to authenticated
using (public.is_admin_or_viewer());

drop policy if exists "Admins can manage candidates" on public.candidates;
create policy "Admins can manage candidates"
on public.candidates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins and viewers can read employers" on public.employers;
create policy "Admins and viewers can read employers"
on public.employers
for select
to authenticated
using (public.is_admin_or_viewer());

drop policy if exists "Admins can manage employers" on public.employers;
create policy "Admins can manage employers"
on public.employers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins and viewers can read jobs" on public.jobs;
create policy "Admins and viewers can read jobs"
on public.jobs
for select
to authenticated
using (public.is_admin_or_viewer());

drop policy if exists "Admins can manage jobs" on public.jobs;
create policy "Admins can manage jobs"
on public.jobs
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins and viewers can read applications" on public.applications;
create policy "Admins and viewers can read applications"
on public.applications
for select
to authenticated
using (public.is_admin_or_viewer());

drop policy if exists "Admins can manage contact requests" on public.contact_requests;
drop policy if exists "Admins and viewers can read contact requests" on public.contact_requests;
create policy "Admins and viewers can read contact requests"
on public.contact_requests
for select
to authenticated
using (public.is_admin_or_viewer());

create policy "Admins can manage contact requests"
on public.contact_requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can create contact requests" on public.contact_requests;
create policy "Anyone can create contact requests"
on public.contact_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Admins and viewers can read coupons" on public.coupons;
create policy "Admins and viewers can read coupons"
on public.coupons
for select
to authenticated
using (public.is_admin_or_viewer());

create policy "Admins can manage coupons"
on public.coupons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage transactions" on public.transactions;
drop policy if exists "Admins and viewers can read transactions" on public.transactions;
create policy "Admins and viewers can read transactions"
on public.transactions
for select
to authenticated
using (public.is_admin_or_viewer());

create policy "Admins can manage transactions"
on public.transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists contact_requests_status_idx on public.contact_requests(status);
create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists transactions_user_id_idx on public.transactions(user_id);

insert into storage.buckets (id, name, public)
values ('certifications', 'certifications', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- RC internal employee support and ticket management
-- ---------------------------------------------------------------------------

alter table if exists public.profiles
add column if not exists username text,
add column if not exists suspended boolean default false;

alter table if exists public.profiles
drop constraint if exists profiles_role_check;

alter table if exists public.profiles
add constraint profiles_role_check
check (role in ('candidate', 'employer', 'employee', 'admin', 'viewer'));

create unique index if not exists profiles_username_unique
on public.profiles (lower(username))
where username is not null;

create or replace function public.generate_rc_username(profile_role text, profile_name text, profile_email text, profile_id uuid)
returns text
language plpgsql
as $$
declare
  prefix text := case
    when profile_role = 'employer' then 'employer'
    when profile_role = 'employee' then 'employee'
    when profile_role = 'admin' then 'admin'
    else 'candidate'
  end;
  sequence_number bigint;
begin
  select count(*) + 1 into sequence_number
  from public.profiles
  where role = profile_role;

  return prefix || '_' || lpad(sequence_number::text, 6, '0');
end;
$$;

create or replace function public.ensure_profile_username()
returns trigger
language plpgsql
as $$
begin
  if new.username is null or length(trim(new.username)) = 0 then
    new.username := public.generate_rc_username(new.role, coalesce(new.full_name, new.name), new.email, new.id);
  end if;

  if new.username !~ '^[a-z0-9][a-z0-9_-]{2,28}[a-z0-9]$' then
    raise exception 'Invalid username format';
  end if;

  new.username := lower(new.username);
  return new;
end;
$$;

drop trigger if exists profiles_username_before_write on public.profiles;
create trigger profiles_username_before_write
before insert or update of username, role on public.profiles
for each row execute function public.ensure_profile_username();

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  username text not null unique,
  department text default 'Support',
  permissions text[] default array['tickets:read', 'tickets:update', 'messages:create'],
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_class where relkind = 'S' and relname = 'support_ticket_number_seq') then
    create sequence support_ticket_number_seq start 100001;
  end if;
end;
$$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default ('RC-' || extract(year from now())::text || '-' || lpad(nextval('support_ticket_number_seq')::text, 6, '0')),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null check (user_role in ('candidate', 'employer', 'employee', 'admin')),
  username text not null,
  subject text not null,
  message text not null,
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'RESOLVED', 'CLOSED')),
  assigned_employee_id uuid references auth.users(id) on delete set null,
  attachment_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('candidate', 'employer', 'employee', 'admin')),
  message text not null,
  internal_note boolean default false,
  attachment_urls text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_assigned_employee_idx on public.support_tickets(assigned_employee_id);
create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);

alter table public.employees enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "Employees read own employee profile" on public.employees;
create policy "Employees read own employee profile"
on public.employees for select
to authenticated
using (user_id = auth.uid() or public.current_profile_role() in ('admin', 'viewer'));

drop policy if exists "Admins manage employees" on public.employees;
create policy "Admins manage employees"
on public.employees for all
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

drop policy if exists "Users read own tickets and agents read assigned" on public.support_tickets;
create policy "Users read own tickets and agents read assigned"
on public.support_tickets for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin', 'viewer')
  or (public.current_profile_role() = 'employee' and (assigned_employee_id is null or assigned_employee_id = auth.uid()))
);

drop policy if exists "Users create own tickets" on public.support_tickets;
create policy "Users create own tickets"
on public.support_tickets for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Agents update tickets" on public.support_tickets;
create policy "Agents update tickets"
on public.support_tickets for update
to authenticated
using (public.current_profile_role() in ('admin', 'employee'))
with check (public.current_profile_role() in ('admin', 'employee'));

drop policy if exists "Users and agents read ticket messages" on public.ticket_messages;
create policy "Users and agents read ticket messages"
on public.ticket_messages for select
to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.user_id = auth.uid()
        or public.current_profile_role() in ('admin', 'viewer')
        or (public.current_profile_role() = 'employee' and (t.assigned_employee_id is null or t.assigned_employee_id = auth.uid()))
      )
  )
  and (
    internal_note = false
    or public.current_profile_role() in ('admin', 'employee')
  )
);

drop policy if exists "Users and agents create ticket messages" on public.ticket_messages;
create policy "Users and agents create ticket messages"
on public.ticket_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.user_id = auth.uid()
        or public.current_profile_role() in ('admin', 'employee')
      )
  )
  and (
    internal_note = false
    or public.current_profile_role() in ('admin', 'employee')
  )
);

insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated support attachment uploads" on storage.objects;
create policy "Authenticated support attachment uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'support-attachments');

drop policy if exists "Authenticated support attachment reads" on storage.objects;
create policy "Authenticated support attachment reads"
on storage.objects for select
to authenticated
using (bucket_id = 'support-attachments');
