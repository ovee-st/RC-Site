alter table public.hiring_requests add column if not exists employer_user_id uuid references auth.users(id) on delete set null;
alter table public.hiring_requests add column if not exists positions_required text;
alter table public.hiring_requests add column if not exists hiring_volume integer;
alter table public.hiring_requests add column if not exists job_location text;
alter table public.hiring_requests add column if not exists requirement_details text;
alter table public.hiring_requests add column if not exists status text not null default 'new';
alter table public.hiring_requests add column if not exists updated_at timestamptz not null default now();

create index if not exists hiring_requests_employer_created_idx
  on public.hiring_requests(employer_user_id, created_at desc);
create index if not exists hiring_requests_status_created_idx
  on public.hiring_requests(status, created_at desc);

alter table public.hiring_requests enable row level security;

drop policy if exists "Employers create hiring consultations" on public.hiring_requests;
create policy "Employers create hiring consultations"
on public.hiring_requests for insert
to authenticated
with check (employer_user_id = auth.uid());

drop policy if exists "Employers read own hiring consultations" on public.hiring_requests;
create policy "Employers read own hiring consultations"
on public.hiring_requests for select
to authenticated
using (employer_user_id = auth.uid());
