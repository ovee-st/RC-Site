const UUID_PATTERN = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const TRAILING_UUID = new RegExp(`(${UUID_PATTERN})$`, "i");

export function slugifyJobTitle(title: string) {
  const normalized = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return normalized || "job";
}

export function buildJobSlug(title: string, id: string) {
  return `${slugifyJobTitle(title)}-${id.toLowerCase()}`;
}

export function getCanonicalJobSlug(job: {
  id: string;
  job_title: string;
  seo_slug_custom?: string | null;
  seo_slug_generated?: string | null;
}) {
  return buildJobSlug(job.seo_slug_custom || job.seo_slug_generated || job.job_title, job.id);
}

export function getJobIdFromSlug(slug: string) {
  return slug.match(TRAILING_UUID)?.[1]?.toLowerCase() ?? null;
}
