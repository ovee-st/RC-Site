create table if not exists public.live_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.support_tickets(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text not null check (user_role in ('candidate','employer')),
  username text,
  employee_id uuid references public.employees(id) on delete set null,
  status text not null default 'WAITING' check (status in ('WAITING','ACTIVE','ENDED')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  last_message_at timestamptz not null default now()
);

create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.live_chat_sessions(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('candidate','employer','employee','admin','viewer')),
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index if not exists live_chat_sessions_user_id_idx on public.live_chat_sessions(user_id);
create index if not exists live_chat_sessions_employee_id_idx on public.live_chat_sessions(employee_id);
create index if not exists live_chat_sessions_status_idx on public.live_chat_sessions(status);
create index if not exists live_chat_sessions_last_message_at_idx on public.live_chat_sessions(last_message_at desc);
create index if not exists live_chat_messages_session_id_idx on public.live_chat_messages(session_id, created_at);

alter table public.live_chat_sessions enable row level security;
alter table public.live_chat_messages enable row level security;

drop policy if exists "Users can read their own live chat sessions" on public.live_chat_sessions;
create policy "Users can read their own live chat sessions"
on public.live_chat_sessions
for select
using (user_id = auth.uid());

drop policy if exists "Agents can read assigned or waiting live chat sessions" on public.live_chat_sessions;
create policy "Agents can read assigned or waiting live chat sessions"
on public.live_chat_sessions
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role in ('admin','viewer')
        or (p.role = 'employee' and (live_chat_sessions.employee_id is null or live_chat_sessions.employee_id = auth.uid()))
      )
  )
);

drop policy if exists "Candidates and employers can start live chat" on public.live_chat_sessions;
create policy "Candidates and employers can start live chat"
on public.live_chat_sessions
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('candidate','employer')
  )
);

drop policy if exists "Participants and agents can update live chat sessions" on public.live_chat_sessions;
create policy "Participants and agents can update live chat sessions"
on public.live_chat_sessions
for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin','viewer') or (p.role = 'employee' and (live_chat_sessions.employee_id is null or live_chat_sessions.employee_id = auth.uid())))
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role in ('admin','viewer') or (p.role = 'employee' and (live_chat_sessions.employee_id is null or live_chat_sessions.employee_id = auth.uid())))
  )
);

drop policy if exists "Live chat participants can read messages" on public.live_chat_messages;
create policy "Live chat participants can read messages"
on public.live_chat_messages
for select
using (
  exists (
    select 1 from public.live_chat_sessions s
    where s.id = live_chat_messages.session_id
      and (
        s.user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and (p.role in ('admin','viewer') or (p.role = 'employee' and (s.employee_id is null or s.employee_id = auth.uid())))
        )
      )
  )
);

drop policy if exists "Live chat participants can send messages" on public.live_chat_messages;
create policy "Live chat participants can send messages"
on public.live_chat_messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.live_chat_sessions s
    where s.id = live_chat_messages.session_id
      and s.status <> 'ENDED'
      and (
        s.user_id = auth.uid()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role in ('admin','employee')
            and (p.role = 'admin' or s.employee_id is null or s.employee_id = auth.uid())
        )
      )
  )
);

create or replace function public.touch_live_chat_session_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.live_chat_sessions
  set last_message_at = new.created_at
  where id = new.session_id;
  return new;
end;
$function$;

drop trigger if exists live_chat_messages_touch_session on public.live_chat_messages;
create trigger live_chat_messages_touch_session
after insert on public.live_chat_messages
for each row execute function public.touch_live_chat_session_from_message();

do $function$
begin
  alter publication supabase_realtime add table public.live_chat_sessions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$function$;

do $function$
begin
  alter publication supabase_realtime add table public.live_chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$function$;
