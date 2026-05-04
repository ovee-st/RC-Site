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
