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

-- The base schema already creates these support tables. Keep this migration
-- additive so the canonical support columns are added explicitly.
alter table public.employees
  add column if not exists avatar_url text,
  add column if not exists role text default 'employee',
  add column if not exists status text not null default 'active',
  add column if not exists is_active boolean default true;

alter table public.support_tickets
  add column if not exists category text not null default 'Other',
  add column if not exists attachment_url text;

alter table public.ticket_messages
  add column if not exists attachment_url text,
  add column if not exists is_internal_note boolean generated always as (internal_note) stored;

create table if not exists public.ticket_activity (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  actor_role text not null,
  action text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists ticket_activity_ticket_id_idx on public.ticket_activity(ticket_id);

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
insert into public.employees (id, user_id, full_name, email, username, department)
select id, id, coalesce(full_name, email), email, coalesce(username, 'employee_' || right(id::text, 6)), 'Support'
from public.profiles
where role = 'employee'
on conflict (id) do update set
  user_id = excluded.user_id,
  full_name = excluded.full_name,
  email = excluded.email,
  username = excluded.username,
  department = excluded.department;
