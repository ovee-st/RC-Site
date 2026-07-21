import "server-only";

import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { buildJobSlug, getJobIdFromSlug, slugifyJobTitle } from "@/lib/jobSeo";
import { getActivePublicJobs, type PublicJobRecord } from "@/lib/jobSeoData";

const COMPANY_COLUMNS = "id, user_id, company_name, location, industry, company_size, about, photo_url, banner_url, website_url, category, verified";
const COMPANY_FALLBACK_COLUMNS = "id, user_id, company_name, location, industry, company_size, about, photo_url, banner_url, category, verified";

export type PublicCompanyRecord = {
  id: string;
  user_id: string | null;
  company_name: string;
  location: string | null;
  industry: string | null;
  company_size: string | null;
  about: string | null;
  photo_url: string | null;
  banner_url: string | null;
  website_url?: string | null;
  category: string | null;
  verified: boolean | null;
};

export type SeoHubLink = { label: string; slug: string; count: number };
export type PopularCompany = { name: string; employerId: string; count: number };

function normalizeCompany(value: unknown) {
  return value as PublicCompanyRecord;
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function popularCompanies(jobs: PublicJobRecord[], limit = 6): PopularCompany[] {
  const companies = new Map<string, PopularCompany>();
  jobs.forEach((job) => {
    if (!job.company_name || !job.employer_id) return;
    const key = job.employer_id;
    const current = companies.get(key);
    companies.set(key, { name: job.company_name, employerId: key, count: (current?.count || 0) + 1 });
  });
  return [...companies.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

function categoryLinks(jobs: PublicJobRecord[], excluded?: string): SeoHubLink[] {
  return countValues(jobs.map((job) => job.category))
    .filter(([label]) => slugifyJobTitle(label) !== excluded)
    .slice(0, 8)
    .map(([label, count]) => ({ label, slug: slugifyJobTitle(label), count }));
}

function locationLinks(jobs: PublicJobRecord[], excluded?: string): SeoHubLink[] {
  return countValues(jobs.map((job) => job.job_location || "Remote"))
    .filter(([label]) => slugifyJobTitle(label) !== excluded)
    .slice(0, 8)
    .map(([label, count]) => ({ label, slug: slugifyJobTitle(label), count }));
}

function humanizeSlug(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function fetchCompanyPageData(slug: string) {
  const identifier = getJobIdFromSlug(slug);
  if (!identifier) return null;

  try {
    const client = createServerSupabaseClient();
    const companyResult = await client
      .from("employers")
      .select(COMPANY_COLUMNS)
      .or(`id.eq.${identifier},user_id.eq.${identifier}`)
      .limit(1)
      .maybeSingle();
    let data: Record<string, unknown> | null = companyResult.data as Record<string, unknown> | null;
    let error = companyResult.error;

    if (error && /website_url/i.test(error.message || "")) {
      const fallback = await client
        .from("employers")
        .select(COMPANY_FALLBACK_COLUMNS)
        .or(`id.eq.${identifier},user_id.eq.${identifier}`)
        .limit(1)
        .maybeSingle();
      data = fallback.data as Record<string, unknown> | null;
      error = fallback.error;
    }

    if (error || !data) {
      if (error) console.error("[company-seo] Company lookup failed", { code: error.code, message: error.message });
      return null;
    }

    const company = normalizeCompany(data);
    const jobs = await getActivePublicJobs();
    const companyIdentifier = company.user_id || company.id;
    const openJobs = jobs.filter((job) => job.employer_id === companyIdentifier || job.company_name === company.company_name);

    const { data: relatedData, error: relatedError } = await client
      .from("employers")
      .select(COMPANY_FALLBACK_COLUMNS)
      .neq("id", company.id)
      .order("created_at", { ascending: false })
      .limit(12);

    if (relatedError) console.error("[company-seo] Related company lookup failed", { code: relatedError.code, message: relatedError.message });
    const relatedCompanies = (relatedData ?? [])
      .map(normalizeCompany)
      .map((related) => ({
        company: related,
        score: Number(related.industry === company.industry) * 2 + Number(related.location === company.location)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ company: related }) => related);

    return {
      company,
      openJobs,
      relatedCompanies,
      categories: categoryLinks(openJobs),
      locations: locationLinks(openJobs),
      benefits: Array.from(new Set(openJobs.map((job) => job.benefits).filter((value): value is string => Boolean(value))))
    };
  } catch (error) {
    console.error("[company-seo] Company page lookup failed", error);
    return null;
  }
}

export const getCompanyPageData = unstable_cache(fetchCompanyPageData, ["company-seo-page"], { revalidate: 300 });

async function fetchCategoryHub(slug: string) {
  const allJobs = await getActivePublicJobs();
  const jobs = allJobs.filter((job) => slugifyJobTitle(job.category) === slug);
  const label = jobs[0]?.category || humanizeSlug(slug);
  return {
    label,
    jobs,
    relatedCategories: categoryLinks(allJobs, slug),
    locations: locationLinks(jobs.length ? jobs : allJobs),
    popularCompanies: popularCompanies(jobs.length ? jobs : allJobs)
  };
}

export const getCategoryHub = unstable_cache(fetchCategoryHub, ["job-category-hub"], { revalidate: 300 });

async function fetchLocationHub(slug: string) {
  const allJobs = await getActivePublicJobs();
  const jobs = allJobs.filter((job) => {
    const locationSlug = slugifyJobTitle(job.job_location || "remote");
    return locationSlug === slug || locationSlug.startsWith(`${slug}-`) || locationSlug.endsWith(`-${slug}`);
  });
  const label = jobs[0]?.job_location || humanizeSlug(slug);
  return {
    label,
    jobs,
    relatedCategories: categoryLinks(jobs.length ? jobs : allJobs),
    locations: locationLinks(allJobs, slug),
    popularCompanies: popularCompanies(jobs.length ? jobs : allJobs)
  };
}

export const getLocationHub = unstable_cache(fetchLocationHub, ["job-location-hub"], { revalidate: 300 });

async function fetchSeoHubSitemapData() {
  const jobs = await getActivePublicJobs();
  const categories = Array.from(new Set(jobs.map((job) => slugifyJobTitle(job.category))));
  const locations = Array.from(new Set(jobs.map((job) => slugifyJobTitle(job.job_location || "remote"))));
  let companies: Array<{ slug: string; createdAt: string }> = [];

  const hasServerCredentials = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE)
  );

  if (hasServerCredentials) {
    try {
      const client = createServerSupabaseClient();
      const { data, error } = await client
        .from("employers")
        .select("id, user_id, company_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (!error) {
        companies = (data ?? []).map((company) => ({
          slug: buildJobSlug(company.company_name, company.user_id || company.id),
          createdAt: company.created_at
        }));
      }
    } catch (error) {
      console.error("[company-seo] Sitemap company lookup failed", error);
    }
  }

  return { categories, locations, companies };
}

export const getSeoHubSitemapData = unstable_cache(fetchSeoHubSitemapData, ["seo-hub-sitemap"], { revalidate: 3600 });
