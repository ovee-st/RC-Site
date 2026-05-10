-- RC support center + internal employee ticket management system
-- Run this in Supabase SQL Editor after your base schema.

create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists username text,
  add column if not exists role text default 'candidate';

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('candidate', 'employer', 'employee', 'admin', 'viewer'));

create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

create table if not exists public.employees (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid generated always as (id) stored,
  full_name text not null,
  email text unique not null,
  username text unique,
  avatar_url text,
  department text default 'Support',
  role text default 'employee' check (role in ('employee', 'support_manager')),
  permissions text[] default array['tickets:read','tickets:update','messages:create'],
  active boolean default true,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null check (user_role in ('candidate','employer')),
  username text not null,
  subject text not null,
  category text not null default 'Other',
  message text not null,
  priority text default 'MEDIUM' check (upper(priority) in ('LOW','MEDIUM','HIGH','URGENT')),
  status text default 'OPEN' check (status in ('OPEN','IN_PROGRESS','WAITING_USER','ESCALATED','RESOLVED','CLOSED')),
  assigned_employee_id uuid references public.employees(id),
  attachment_url text,
  attachment_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('candidate','employer','employee','admin','viewer')),
  message text not null,
  attachment_url text,
  attachment_urls text[] default '{}',
  internal_note boolean default false,
  is_internal_note boolean generated always as (internal_note) stored,
  created_at timestamptz default now()
);

create table if not exists public.ticket_activity (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_role text not null,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets(user_id);
create index if not exists support_tickets_assigned_employee_id_idx on public.support_tickets(assigned_employee_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);
create index if not exists ticket_activity_ticket_id_idx on public.ticket_activity(ticket_id);

create or replace function public.current_profile_role()
returns text
language sql
security definer
set search_path = public
as $function$
  select role from public.profiles where id = auth.uid()
$function$;

create or replace function public.generate_rc_username(role_prefix text)
returns text
language plpgsql
as $function$
declare
  next_value integer;
begin
  select coalesce(count(*), 0) + 1
  into next_value
  from public.profiles
  where username is not null
    and lower(username) like lower(role_prefix || '_%');

  return role_prefix || '_' || lpad(next_value::text, 6, '0');
end;
$function$;

create or replace function public.generate_ticket_number()
returns text
language plpgsql
as $function$
declare
  next_value integer;
begin
  select coalesce(count(*), 0) + 1 into next_value
  from public.support_tickets
  where ticket_number like 'RC-' || extract(year from now())::text || '-%';

  return 'RC-' || extract(year from now())::text || '-' || lpad(next_value::text, 6, '0');
end;
$function$;

alter table public.employees enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.ticket_activity enable row level security;

drop policy if exists "employees read internal" on public.employees;
create policy "employees read internal"
on public.employees for select
to authenticated
using (public.current_profile_role() in ('admin','viewer','employee'));

drop policy if exists "employees admin write" on public.employees;
create policy "employees admin write"
on public.employees for all
to authenticated
using (public.current_profile_role() = 'admin')
with check (public.current_profile_role() = 'admin');

drop policy if exists "tickets owner read" on public.support_tickets;
create policy "tickets owner read"
on public.support_tickets for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_profile_role() in ('admin','viewer')
  or (public.current_profile_role() = 'employee' and (assigned_employee_id is null or assigned_employee_id = auth.uid()))
);

drop policy if exists "tickets owner create" on public.support_tickets;
create policy "tickets owner create"
on public.support_tickets for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.current_profile_role() in ('candidate','employer')
);

drop policy if exists "tickets internal update" on public.support_tickets;
create policy "tickets internal update"
on public.support_tickets for update
to authenticated
using (public.current_profile_role() in ('admin','employee'))
with check (public.current_profile_role() in ('admin','employee'));

drop policy if exists "messages visible by ticket access" on public.ticket_messages;
create policy "messages visible by ticket access"
on public.ticket_messages for select
to authenticated
using (
  exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.user_id = auth.uid()
        or public.current_profile_role() in ('admin','viewer')
        or (public.current_profile_role() = 'employee' and (t.assigned_employee_id is null or t.assigned_employee_id = auth.uid()))
      )
      and (internal_note = false or public.current_profile_role() in ('admin','viewer','employee'))
  )
);

drop policy if exists "messages insert by participants" on public.ticket_messages;
create policy "messages insert by participants"
on public.ticket_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id
      and (
        t.user_id = auth.uid()
        or public.current_profile_role() in ('admin','employee')
      )
  )
);

drop policy if exists "activity internal read" on public.ticket_activity;
create policy "activity internal read"
on public.ticket_activity for select
to authenticated
using (
  public.current_profile_role() in ('admin','viewer','employee')
  or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
);

drop policy if exists "activity internal write" on public.ticket_activity;
create policy "activity internal write"
on public.ticket_activity for insert
to authenticated
with check (actor_id = auth.uid());

create or replace function public.touch_support_ticket_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

drop trigger if exists support_tickets_touch_updated_at on public.support_tickets;
create trigger support_tickets_touch_updated_at
before update on public.support_tickets
for each row execute function public.touch_support_ticket_updated_at();

-- Seed demo rows require matching auth users in production. These inserts are safe no-ops
-- unless the referenced profiles/users already exist.
insert into public.employees (id, full_name, email, username, department)
select id, coalesce(full_name, email), email, coalesce(username, 'employee_' || right(id::text, 6)), 'Support'
from public.profiles
where role = 'employee'
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  username = excluded.username,
  department = excluded.department;
