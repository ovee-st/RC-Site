-- MXVL Support Operations Center migration
-- Safe to run after the existing support/live-chat migrations.

create extension if not exists pgcrypto;

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in (
    'candidate',
    'employer',
    'employee',
    'support_agent',
    'support_senior',
    'support_manager',
    'admin',
        'viewer'
  ));

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique,
  user_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_employee_id uuid,
  user_role text,
  username text,
  subject text not null,
  description text,
  message text,
  category text,
  priority text default 'medium',
  status text default 'open',
  source text default 'web',
  tags text[] default '{}',
  attachment_url text,
  attachment_urls text[] default '{}',
  sla_due_at timestamptz,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.support_tickets add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.support_tickets add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.support_tickets add column if not exists assigned_employee_id uuid;
alter table public.support_tickets add column if not exists description text;
alter table public.support_tickets add column if not exists source text default 'web';
alter table public.support_tickets add column if not exists tags text[] default '{}';
alter table public.support_tickets add column if not exists attachment_url text;
alter table public.support_tickets add column if not exists attachment_urls text[] default '{}';
alter table public.support_tickets add column if not exists sla_due_at timestamptz;
alter table public.support_tickets add column if not exists first_response_at timestamptz;
alter table public.support_tickets add column if not exists resolved_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;
alter table public.support_tickets add column if not exists updated_at timestamptz default now();

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  is_internal boolean default false,
  message text not null,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.support_macros (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.support_agent_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tickets_resolved integer default 0,
  avg_first_response_minutes numeric default 0,
  avg_resolution_hours numeric default 0,
  csat_score numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists public.support_ticket_watchers (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  unique(ticket_id, user_id)
);

create or replace function public.is_support_staff(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user_id
      and p.role in ('employee','support_agent','support_senior','support_manager','admin','viewer')
  );
$$;

create or replace function public.can_view_all_support(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user_id
      and p.role in ('support_senior','support_manager','admin','viewer')
  );
$$;

create or replace function public.touch_support_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists support_tickets_touch_updated_at on public.support_tickets;
create trigger support_tickets_touch_updated_at
before update on public.support_tickets
for each row execute function public.touch_support_ticket_updated_at();

alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.support_macros enable row level security;
alter table public.support_agent_stats enable row level security;
alter table public.support_ticket_watchers enable row level security;

drop policy if exists "Users can read own support tickets" on public.support_tickets;
create policy "Users can read own support tickets"
on public.support_tickets for select
to authenticated
using (user_id = auth.uid() or public.is_support_staff(auth.uid()));

drop policy if exists "Users can create own support tickets" on public.support_tickets;
create policy "Users can create own support tickets"
on public.support_tickets for insert
to authenticated
with check (user_id = auth.uid() or public.is_support_staff(auth.uid()));

drop policy if exists "Support staff can update tickets" on public.support_tickets;
create policy "Support staff can update tickets"
on public.support_tickets for update
to authenticated
using (
  public.can_view_all_support(auth.uid())
  or assigned_employee_id = auth.uid()
  or assigned_to = auth.uid()
  or user_id = auth.uid()
)
with check (
  public.can_view_all_support(auth.uid())
  or assigned_employee_id = auth.uid()
  or assigned_to = auth.uid()
  or user_id = auth.uid()
);

drop policy if exists "Ticket messages are visible to participants" on public.support_ticket_messages;
create policy "Ticket messages are visible to participants"
on public.support_ticket_messages for select
to authenticated
using (
  public.is_support_staff(auth.uid())
  or exists (
    select 1 from public.support_tickets t
    where t.id = support_ticket_messages.ticket_id
      and t.user_id = auth.uid()
      and coalesce(support_ticket_messages.is_internal, false) = false
  )
);

drop policy if exists "Ticket messages can be added by participants" on public.support_ticket_messages;
create policy "Ticket messages can be added by participants"
on public.support_ticket_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (
    public.is_support_staff(auth.uid())
    or exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  )
);

drop policy if exists "Support staff can manage macros" on public.support_macros;
create policy "Support staff can manage macros"
on public.support_macros for all
to authenticated
using (public.is_support_staff(auth.uid()))
with check (public.is_support_staff(auth.uid()));

drop policy if exists "Support staff can read agent stats" on public.support_agent_stats;
create policy "Support staff can read agent stats"
on public.support_agent_stats for select
to authenticated
using (public.is_support_staff(auth.uid()));

drop policy if exists "Managers can manage watchers" on public.support_ticket_watchers;
create policy "Managers can manage watchers"
on public.support_ticket_watchers for all
to authenticated
using (public.is_support_staff(auth.uid()))
with check (public.is_support_staff(auth.uid()));

insert into public.support_macros (title, category, content)
values
  ('Password Reset Instructions', 'Account Access', 'Please use the reset password option from the login page. If the link expires, request a new link and check spam/promotions.'),
  ('Payment Verification', 'Payment Issue', 'We are checking your payment record now. Please share the transaction ID or screenshot if available.'),
  ('Pro Plan Upgrade Benefits', 'Subscription', 'Pro gives candidates verified visibility, better CV tools, and priority matching signals across employer searches.'),
  ('CV Download Guidance', 'CV Service', 'Open Resume Builder, choose ATS CV or Customized CV, then download the generated file.'),
  ('Subscription Activation', 'Subscription', 'Your subscription will activate after payment verification. We will notify you as soon as it is active.'),
  ('Employer Posting Help', 'Employer Support', 'Open employer home, click Post New Job, complete the required fields, select skills, and publish the role.')
on conflict do nothing;

-- Optional realtime support. Duplicate-object errors are ignored for reruns.
do $$
begin
  alter publication supabase_realtime add table public.support_tickets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.support_ticket_messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.support_macros;
exception when duplicate_object then null;
end $$;
