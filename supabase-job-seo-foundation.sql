-- Sprint 3A: generated SEO values remain separate from recruiter-authored overrides.
alter table public.jobs add column if not exists seo_title_generated text;
alter table public.jobs add column if not exists seo_title_custom text;
alter table public.jobs add column if not exists seo_description_generated text;
alter table public.jobs add column if not exists seo_description_custom text;
alter table public.jobs add column if not exists seo_slug_generated text;
alter table public.jobs add column if not exists seo_slug_custom text;
alter table public.jobs add column if not exists seo_keywords_generated text[];
alter table public.jobs add column if not exists seo_keywords_custom text[];
alter table public.jobs add column if not exists seo_search_summary_generated text;
alter table public.jobs add column if not exists seo_search_summary_custom text;
alter table public.jobs add column if not exists seo_og_title_generated text;
alter table public.jobs add column if not exists seo_og_title_custom text;
alter table public.jobs add column if not exists seo_og_description_generated text;
alter table public.jobs add column if not exists seo_og_description_custom text;
alter table public.jobs add column if not exists ai_job_summary text;
alter table public.jobs add column if not exists ai_job_highlights text[];
alter table public.jobs add column if not exists ai_ideal_candidate_summary text;
alter table public.jobs add column if not exists ai_required_skills_summary text;
alter table public.jobs add column if not exists ai_preferred_skills_summary text;
alter table public.jobs add column if not exists seo_generated_at timestamptz;

create index if not exists jobs_seo_slug_generated_idx on public.jobs (seo_slug_generated);
create index if not exists jobs_category_status_idx on public.jobs (category, status);
create index if not exists jobs_location_status_idx on public.jobs (job_location, status);
