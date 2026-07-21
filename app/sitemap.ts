import type { MetadataRoute } from "next";
import { getIndexableJobSlugs } from "@/lib/jobSeoData";
import { getSeoHubSitemapData } from "@/lib/seoHubData";
import { SITE_URL } from "@/lib/seo";

const publicRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.9 },
  { path: "/services", changeFrequency: "monthly", priority: 0.8 },
  { path: "/subscriptions", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/help-center", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getIndexableJobSlugs();
  const hubs = await getSeoHubSitemapData();
  const staticEntries = publicRoutes.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency,
    priority
  }));

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: new URL(`/jobs/${job.slug}`, SITE_URL).toString(),
    lastModified: job.createdAt,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  const categoryEntries: MetadataRoute.Sitemap = hubs.categories.map((category) => ({
    url: new URL(`/jobs/category/${category}`, SITE_URL).toString(),
    changeFrequency: "daily",
    priority: 0.7
  }));
  const locationEntries: MetadataRoute.Sitemap = hubs.locations.map((location) => ({
    url: new URL(`/jobs/location/${location}`, SITE_URL).toString(),
    changeFrequency: "daily",
    priority: 0.7
  }));
  const companyEntries: MetadataRoute.Sitemap = hubs.companies.map((company) => ({
    url: new URL(`/company/${company.slug}`, SITE_URL).toString(),
    lastModified: company.createdAt,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...staticEntries, ...jobEntries, ...categoryEntries, ...locationEntries, ...companyEntries];
}
