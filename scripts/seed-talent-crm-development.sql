-- Optional local/development seed for Talent CRM.
-- Before running locally: set app.environment = 'development';
-- This script refuses to run in production and never creates auth users.

do $$
declare
  environment_name text := current_setting('app.environment', true);
  owner_id uuid;
  pool_name text;
begin
  if environment_name not in ('development', 'local', 'test') then
    raise exception 'Talent CRM seed is disabled outside development, local, and test environments.';
  end if;

  select id into owner_id
  from public.profiles
  where lower(role) = 'employer'
  order by created_at
  limit 1;

  if owner_id is null then
    raise notice 'Talent CRM seed skipped: no employer profile exists.';
    return;
  end if;

  foreach pool_name in array array[
    'Marketing Talent', 'Sales Talent', 'Engineering Talent', 'HR Talent',
    'Finance Talent', 'Legal Talent', 'Customer Support', 'Operations'
  ] loop
    insert into public.talent_pools (employer_user_id, name, description, visibility, created_by)
    values (owner_id, pool_name, 'Development seed pool', 'team', owner_id)
    on conflict (employer_user_id, name) do nothing;
  end loop;
end;
$$;
