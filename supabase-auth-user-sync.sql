-- Keeps Supabase Auth users visible inside RC public profile-powered UI.
-- Run once in Supabase SQL Editor after deploying this code.

create extension if not exists pgcrypto;

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists name text,
  add column if not exists role text default 'candidate',
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists photo_url text,
  add column if not exists plan text default 'Basic',
  add column if not exists verified boolean default false,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  add constraint profiles_role_check
  check (role in ('candidate', 'employer', 'employee', 'admin', 'viewer'));

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

create or replace function public.rc_normalize_role(input_role text)
returns text
language plpgsql
immutable
as $$
begin
  input_role := lower(coalesce(input_role, ''));

  if input_role in ('admin', 'viewer', 'employee', 'employer', 'candidate') then
    return input_role;
  end if;

  if input_role in ('admin_viewer', 'admin-viewer', 'admin (viewer)') then
    return 'viewer';
  end if;

  return 'candidate';
end;
$$;

create or replace function public.rc_profile_username(input_role text, input_email text, input_name text, input_id uuid)
returns text
language plpgsql
immutable
as $$
declare
  role_prefix text := case
    when input_role = 'employer' then 'employer'
    when input_role = 'employee' then 'employee'
    when input_role = 'admin' then 'admin'
    else 'candidate'
  end;
  source_text text := coalesce(nullif(input_name, ''), split_part(coalesce(input_email, ''), '@', 1), input_id::text, role_prefix);
  clean_text text := substring(regexp_replace(lower(source_text), '[^a-z0-9]+', '-', 'g') from 1 for 18);
  suffix_text text := substring(md5(coalesce(input_email, input_id::text, source_text)) from 1 for 4);
begin
  clean_text := trim(both '-' from clean_text);
  return substring(role_prefix || '-' || coalesce(nullif(clean_text, ''), 'user') || '-' || suffix_text from 1 for 32);
end;
$$;

create or replace function public.rc_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text := public.rc_normalize_role(new.raw_user_meta_data->>'role');
  resolved_name text := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'company_name', ''),
    split_part(new.email, '@', 1),
    'RC User'
  );
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    name,
    role,
    username,
    avatar_url,
    photo_url,
    plan,
    verified,
    updated_at
  )
  values (
    new.id,
    new.email,
    resolved_name,
    resolved_name,
    resolved_role,
    public.rc_profile_username(resolved_role, new.email, resolved_name, new.id),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'photo_url', new.raw_user_meta_data->>'picture'),
    case when resolved_role in ('admin', 'viewer', 'employee') then 'Internal' else 'Basic' end,
    false,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    name = coalesce(public.profiles.name, excluded.name),
    role = coalesce(public.profiles.role, excluded.role),
    username = coalesce(public.profiles.username, excluded.username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    photo_url = coalesce(public.profiles.photo_url, excluded.photo_url),
    plan = coalesce(public.profiles.plan, excluded.plan),
    verified = coalesce(public.profiles.verified, excluded.verified),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.rc_handle_new_auth_user();

insert into public.profiles (
  id,
  email,
  full_name,
  name,
  role,
  username,
  avatar_url,
  photo_url,
  plan,
  verified,
  updated_at
)
select
  users.id,
  users.email,
  coalesce(
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    nullif(users.raw_user_meta_data->>'company_name', ''),
    split_part(users.email, '@', 1),
    'RC User'
  ) as full_name,
  coalesce(
    nullif(users.raw_user_meta_data->>'full_name', ''),
    nullif(users.raw_user_meta_data->>'name', ''),
    nullif(users.raw_user_meta_data->>'company_name', ''),
    split_part(users.email, '@', 1),
    'RC User'
  ) as name,
  public.rc_normalize_role(users.raw_user_meta_data->>'role') as role,
  public.rc_profile_username(
    public.rc_normalize_role(users.raw_user_meta_data->>'role'),
    users.email,
    coalesce(nullif(users.raw_user_meta_data->>'full_name', ''), nullif(users.raw_user_meta_data->>'name', ''), split_part(users.email, '@', 1)),
    users.id
  ) as username,
  users.raw_user_meta_data->>'avatar_url',
  coalesce(users.raw_user_meta_data->>'photo_url', users.raw_user_meta_data->>'picture'),
  case when public.rc_normalize_role(users.raw_user_meta_data->>'role') in ('admin', 'viewer', 'employee') then 'Internal' else 'Basic' end,
  false,
  now()
from auth.users
left join public.profiles profiles on profiles.id = users.id
where profiles.id is null
on conflict (id) do nothing;
