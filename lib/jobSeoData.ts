import "server-only";

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { getCanonicalJobSlug, getJobIdFromSlug } from "@/lib/jobSeo";
import { defaultRelatedJobRanker } from "@/lib/relatedJobs";

const JOB_SEO_COLUMNS = [
  "id",
  "employer_id",
  "company_name",
  "job_title",
  "job_location",
  "job_type",
  "job_level",
  "employment_type",
  "category",
  "role",
  "description",
  "requirements",
  "required_skills",
  "required_skills_array",
  "experience_level",
  "salary_range",
  "salary_min",
  "salary_max",
  "salary_hidden",
  "benefits",
  "last_date",
  "status",
  "created_at"
].join(", ");

const JOB_ENRICHMENT_COLUMNS = [
  "seo_title_generated",
  "seo_title_custom",
  "seo_description_generated",
  "seo_description_custom",
  "seo_slug_generated",
  "seo_slug_custom",
  "seo_keywords_generated",
  "seo_keywords_custom",
  "seo_search_summary_generated",
  "seo_search_summary_custom",
  "seo_og_title_generated",
  "seo_og_title_custom",
  "seo_og_description_generated",
  "seo_og_description_custom",
  "ai_job_summary",
  "ai_job_highlights",
  "ai_ideal_candidate_summary",
  "ai_required_skills_summary",
  "ai_preferred_skills_summary"
].join(", ");

const JOB_SEO_COLUMNS_WITH_ENRICHMENT = `${JOB_SEO_COLUMNS}, ${JOB_ENRICHMENT_COLUMNS}`;

export type PublicJobRecord = {
  id: string;
  employer_id: string;
  company_name: string | null;
  job_title: string;
  job_location: string | null;
  job_type: string | null;
  job_level: string | null;
  employment_type: string | null;
  category: string;
  role: string | null;
  description: string | null;
  requirements: string | null;
  required_skills: string | null;
  required_skills_array: string[] | null;
  experience_level: string | null;
  salary_range: string | null;
  salary_min: number | string | null;
  salary_max: number | string | null;
  salary_hidden: boolean | null;
  benefits: string | null;
  last_date: string | null;
  status: string | null;
  created_at: string;
  seo_title_generated?: string | null;
  seo_title_custom?: string | null;
  seo_description_generated?: string | null;
  seo_description_custom?: string | null;
  seo_slug_generated?: string | null;
  seo_slug_custom?: string | null;
  seo_keywords_generated?: string[] | null;
  seo_keywords_custom?: string[] | null;
  seo_search_summary_generated?: string | null;
  seo_search_summary_custom?: string | null;
  seo_og_title_generated?: string | null;
  seo_og_title_custom?: string | null;
  seo_og_description_generated?: string | null;
  seo_og_description_custom?: string | null;
  ai_job_summary?: string | null;
  ai_job_highlights?: string[] | null;
  ai_ideal_candidate_summary?: string | null;
  ai_required_skills_summary?: string | null;
  ai_preferred_skills_summary?: string | null;
};

function normalizeJob(row: unknown) {
  return row as PublicJobRecord;
}

function isExpired(deadline: string | null, now = new Date()) {
  if (!deadline) return false;
  const endOfDeadline = new Date(`${deadline}T23:59:59.999`);
  return Number.isFinite(endOfDeadline.getTime()) && endOfDeadline < now;
}

function createPublicJobsClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function isMissingSeoColumn(error: { code?: string; message?: string } | null) {
  return Boolean(error && (error.code === "42703" || error.code === "PGRST204") && /seo_|ai_/i.test(error.message || ""));
}

async function fetchJobBySlug(slug: string) {
  const jobId = getJobIdFromSlug(slug);
  if (!jobId) return null;

  try {
    const client = createPublicJobsClient();
    if (!client) return null;
    let { data, error } = await client
      .from("jobs")
      .select(JOB_SEO_COLUMNS_WITH_ENRICHMENT)
      .eq("id", jobId)
      .maybeSingle();

    if (isMissingSeoColumn(error)) {
      const fallback = await client.from("jobs").select(JOB_SEO_COLUMNS).eq("id", jobId).maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[job-seo] Could not load job", { jobId, code: error.code, message: error.message });
      return null;
    }

    return data ? normalizeJob(data) : null;
  } catch (error) {
    console.error("[job-seo] Job lookup failed", error);
    return null;
  }
}

export const getPublicJobBySlug = unstable_cache(fetchJobBySlug, ["public-job-by-slug"], {
  revalidate: 300
});

async function fetchRelatedJobs(source: PublicJobRecord) {
  try {
    const client = createPublicJobsClient();
    if (!client) return [];
    const { data, error } = await client
      .from("jobs")
      .select(JOB_SEO_COLUMNS)
      .eq("status", "active")
      .neq("id", source.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[job-seo] Could not load related jobs", { code: error.code, message: error.message });
      return [];
    }

    const candidates = (data ?? [])
      .map(normalizeJob)
      .filter((job) => !isExpired(job.last_date));

    return defaultRelatedJobRanker.rank(source, candidates).slice(0, 3) as PublicJobRecord[];
  } catch (error) {
    console.error("[job-seo] Related jobs lookup failed", error);
    return [];
  }
}

export const getRelatedPublicJobs = unstable_cache(fetchRelatedJobs, ["related-public-jobs"], {
  revalidate: 300
});

async function fetchIndexableJobs() {
  try {
    const client = createPublicJobsClient();
    if (!client) return [];
    const enrichedResult = await client
      .from("jobs")
      .select("id, job_title, last_date, status, created_at, seo_slug_generated, seo_slug_custom")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5000);
    let data: Array<Record<string, unknown>> | null = enrichedResult.data as Array<Record<string, unknown>> | null;
    let error = enrichedResult.error;

    if (isMissingSeoColumn(error)) {
      const fallback = await client
        .from("jobs")
        .select("id, job_title, last_date, status, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5000);
      data = fallback.data as Array<Record<string, unknown>> | null;
      error = fallback.error;
    }

    if (error) {
      console.error("[job-seo] Could not load sitemap jobs", { code: error.code, message: error.message });
      return [];
    }

    const sitemapJobs = (data ?? []) as Array<{
      id: string;
      job_title: string;
      last_date: string | null;
      created_at: string;
      seo_slug_generated?: string | null;
      seo_slug_custom?: string | null;
    }>;

    return sitemapJobs
      .filter((job) => !isExpired(job.last_date))
      .map((job) => ({
        slug: getCanonicalJobSlug(job),
        createdAt: job.created_at
      }));
  } catch (error) {
    console.error("[job-seo] Sitemap job lookup failed", error);
    return [];
  }
}

export const getIndexableJobSlugs = unstable_cache(fetchIndexableJobs, ["indexable-job-slugs"], {
  revalidate: 3600
});

async function fetchActivePublicJobs() {
  try {
    const client = createPublicJobsClient();
    if (!client) return [];
    const { data, error } = await client
      .from("jobs")
      .select(JOB_SEO_COLUMNS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("[job-seo] Could not load SEO hub jobs", { code: error.code, message: error.message });
      return [];
    }

    return (data ?? []).map(normalizeJob).filter((job) => !isExpired(job.last_date));
  } catch (error) {
    console.error("[job-seo] SEO hub job lookup failed", error);
    return [];
  }
}

export const getActivePublicJobs = unstable_cache(fetchActivePublicJobs, ["active-public-jobs"], {
  revalidate: 300
});
