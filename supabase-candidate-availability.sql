-- Candidate availability preferences
-- Run in Supabase SQL editor before relying on employer-wide visibility.
alter table public.candidates
  add column if not exists immediate_availability boolean default true,
  add column if not exists notice_period_value integer,
  add column if not exists notice_period_unit text;

alter table public.candidates
  drop constraint if exists candidates_notice_period_unit_check;

alter table public.candidates
  add constraint candidates_notice_period_unit_check
  check (notice_period_unit is null or notice_period_unit in ('Days', 'Months'));
