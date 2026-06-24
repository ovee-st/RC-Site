alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;
alter table public.candidates add column if not exists photo_url text;
alter table public.candidates add column if not exists banner_url text;
alter table public.employers add column if not exists photo_url text;
alter table public.employers add column if not exists banner_url text;
alter table public.employers add column if not exists linkedin_url text;
alter table public.employers add column if not exists website_url text;
alter table public.employers add column if not exists facebook_url text;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Users upload own profile media" on storage.objects;
create policy "Users upload own profile media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users update own profile media" on storage.objects;
create policy "Users update own profile media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public reads profile media" on storage.objects;
create policy "Public reads profile media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-photos');
