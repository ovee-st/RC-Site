import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Send,
  Sparkles
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Container from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { buildJobSlug, getCanonicalJobSlug, slugifyJobTitle } from "@/lib/jobSeo";
import { getPublicJobBySlug, getRelatedPublicJobs, type PublicJobRecord } from "@/lib/jobSeoData";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { generateJobContent, preferCustomSeo } from "@/lib/seoGenerator";
import { generateBreadcrumbSchema, serializeJsonLd } from "@/lib/schema";

type JobPageProps = {
  params: Promise<{ slug: string }>;
};

function isExpired(job: PublicJobRecord) {
  if (!job.last_date) return false;
  const deadline = new Date(`${job.last_date}T23:59:59.999`);
  return Number.isFinite(deadline.getTime()) && deadline < new Date();
}

function cleanText(value: string | null | undefined) {
  return String(value || "")
    .replace(/[#*_>`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function metadataDescription(job: PublicJobRecord) {
  const description = cleanText(job.description || job.requirements);
  const fallback = `${job.job_title} opportunity at ${job.company_name || "an employer"} through ${SITE_NAME}.`;
  const value = description || fallback || DEFAULT_DESCRIPTION;
  return value.length > 157 ? `${value.slice(0, 156).trimEnd()}…` : value;
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (!Number.isFinite(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function formatSalary(job: PublicJobRecord) {
  if (job.salary_hidden) return "Salary disclosed during hiring";

  const minimum = Number(job.salary_min || 0);
  const maximum = Number(job.salary_max || 0);
  const formatter = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });

  if (minimum && maximum) return `${formatter.format(minimum)} – ${formatter.format(maximum)} per month`;
  if (minimum) return `From ${formatter.format(minimum)} per month`;
  if (maximum) return `Up to ${formatter.format(maximum)} per month`;
  return cleanText(job.salary_range) || "Salary disclosed during hiring";
}

function jobSkills(job: PublicJobRecord) {
  if (Array.isArray(job.required_skills_array) && job.required_skills_array.length) {
    return job.required_skills_array.map(String).map((skill) => skill.trim()).filter(Boolean);
  }

  return String(job.required_skills || "")
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function responsibilitiesFromDescription(description: string | null) {
  const value = String(description || "");
  const match = value.match(/responsibilities\s*:\s*([\s\S]*?)(?=\n\s*(?:requirements|qualifications|skills|benefits)\s*:|$)/i);
  if (!match) return value;
  return match[1].trim();
}

function employmentType(value: string | null) {
  const normalized = String(value || "FULL_TIME").toUpperCase().replace(/[\s-]+/g, "_");
  const supported = new Set(["FULL_TIME", "PART_TIME", "CONTRACTOR", "TEMPORARY", "INTERN", "VOLUNTEER", "PER_DIEM", "OTHER"]);
  return supported.has(normalized) ? normalized : "OTHER";
}

function jsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildJobPosting(job: PublicJobRecord, canonicalUrl: string) {
  const minimum = Number(job.salary_min || 0);
  const maximum = Number(job.salary_max || 0);
  const location = cleanText(job.job_location) || "Remote";
  const validThrough = job.last_date ? new Date(`${job.last_date}T23:59:59.999+06:00`).toISOString() : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.job_title,
    description: cleanText(job.description || job.requirements),
    identifier: {
      "@type": "PropertyValue",
      name: job.company_name || SITE_NAME,
      value: job.id
    },
    datePosted: new Date(job.created_at).toISOString(),
    ...(validThrough ? { validThrough } : {}),
    employmentType: employmentType(job.employment_type || job.job_type),
    hiringOrganization: {
      "@type": "Organization",
      name: job.company_name || "Confidential employer"
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: location
      }
    },
    applicantLocationRequirements: {
      "@type": "AdministrativeArea",
      name: location
    },
    skills: jobSkills(job).join(", "),
    responsibilities: cleanText(responsibilitiesFromDescription(job.description)),
    qualifications: cleanText(job.requirements),
    ...(job.salary_hidden || (!minimum && !maximum)
      ? {}
      : {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "BDT",
            value: {
              "@type": "QuantitativeValue",
              ...(minimum ? { minValue: minimum } : {}),
              ...(maximum ? { maxValue: maximum } : {}),
              unitText: "MONTH"
            }
          }
        }),
    url: canonicalUrl
  };
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);

  if (!job) {
    return {
      title: "Job Not Found",
      description: "The requested job opportunity could not be found.",
      robots: { index: false, follow: false }
    };
  }

  const canonicalSlug = getCanonicalJobSlug(job);
  const canonicalPath = `/jobs/${canonicalSlug}`;
  const title = preferCustomSeo(job.seo_title_custom, job.seo_title_generated, `${job.job_title} at ${job.company_name || "Confidential Employer"}`);
  const description = preferCustomSeo(job.seo_description_custom, job.seo_description_generated, metadataDescription(job));
  const openGraphTitle = preferCustomSeo(job.seo_og_title_custom, job.seo_og_title_generated, title);
  const openGraphDescription = preferCustomSeo(job.seo_og_description_custom, job.seo_og_description_generated, description);
  const expired = isExpired(job);

  return {
    title,
    description,
    keywords: job.seo_keywords_custom || job.seo_keywords_generated || jobSkills(job),
    alternates: { canonical: canonicalPath },
    robots: expired || String(job.status).toLowerCase() !== "active"
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      url: canonicalPath,
      title: openGraphTitle,
      description: openGraphDescription,
      siteName: SITE_NAME,
      publishedTime: job.created_at,
      images: [{ url: "/android/icon-512.png", width: 512, height: 512, alt: SITE_NAME }]
    },
    twitter: {
      card: "summary",
      title: openGraphTitle,
      description: openGraphDescription,
      images: ["/android/icon-512.png"]
    }
  };
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) notFound();

  const canonicalSlug = getCanonicalJobSlug(job);
  if (slug !== canonicalSlug) permanentRedirect(`/jobs/${canonicalSlug}`);

  const canonicalUrl = new URL(`/jobs/${canonicalSlug}`, SITE_URL).toString();
  const relatedJobs = await getRelatedPublicJobs(job);
  const skills = jobSkills(job);
  const expired = isExpired(job);
  const responsibilities = responsibilitiesFromDescription(job.description);
  const generatedContent = generateJobContent({
    title: job.job_title,
    company: job.company_name || "Confidential employer",
    location: job.job_location || "Flexible location",
    category: job.category,
    employmentType: job.employment_type || job.job_type || "Employment",
    experience: job.experience_level || job.job_level || "Relevant",
    description: job.description || "",
    requirements: job.requirements || "",
    skills
  });
  const jobSummary = job.ai_job_summary || generatedContent.summary;
  const jobHighlights = job.ai_job_highlights?.length ? job.ai_job_highlights : generatedContent.highlights;
  const idealCandidate = job.ai_ideal_candidate_summary || generatedContent.idealCandidate;
  const requiredSkillsSummary = job.ai_required_skills_summary || generatedContent.requiredSkillsSummary;
  const preferredSkillsSummary = job.ai_preferred_skills_summary || generatedContent.preferredSkillsSummary;
  const jobPosting = buildJobPosting(job, canonicalUrl);
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL.toString() },
    { name: "Jobs", url: new URL("/jobs", SITE_URL).toString() },
    { name: job.job_title, url: canonicalUrl }
  ]);
  const companyPath = `/company/${buildJobSlug(job.company_name || "company", job.employer_id)}`;
  const categoryPath = `/jobs/category/${slugifyJobTitle(job.category)}`;
  const locationPath = `/jobs/location/${slugifyJobTitle(job.job_location || "remote")}`;

  return (
    <main className="bg-bg pb-20 dark:bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(jobPosting) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }} />

      <section className="border-b border-border bg-surface py-6 dark:border-white/10 dark:bg-slate-900">
        <Container>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-text-muted dark:text-slate-300">
            <Link href="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <Link href="/jobs" className="hover:text-primary">Jobs</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-full truncate text-text-main dark:text-white" aria-current="page">{job.job_title}</span>
          </nav>
        </Container>
      </section>

      <section className="border-b border-border bg-surface py-10 dark:border-white/10 dark:bg-slate-900 sm:py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">{job.category}</Badge>
                <Badge variant={expired ? "danger" : "success"}>{expired ? "Applications closed" : "Actively hiring"}</Badge>
              </div>
              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight tracking-tight text-text-main dark:text-white sm:text-5xl">{job.job_title}</h1>
              <p className="mt-4 flex items-center gap-2 text-lg font-bold text-text-muted dark:text-slate-300">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                <Link href={companyPath} className="hover:text-primary hover:underline">{job.company_name || "Confidential employer"}</Link>
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-text-muted dark:text-slate-300">
                <Link href={locationPath} className="flex items-center gap-2 hover:text-primary"><MapPin className="h-4 w-4 text-primary" />{job.job_location || "Location flexible"}</Link>
                <span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-primary" />{job.employment_type || job.job_type || "Employment type not specified"}</span>
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{job.experience_level || job.job_level || "Experience flexible"}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
              {expired ? (
                <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-7 py-3.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Applications closed</span>
              ) : (
                <LinkButton href={`/jobs?job=${encodeURIComponent(job.id)}`} className="gap-2 px-7 py-3.5">
                  <Send className="h-4 w-4" />Apply now
                </LinkButton>
              )}
              <LinkButton href="/jobs" variant="secondary" className="px-7 py-3.5">Browse all jobs</LinkButton>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 space-y-8">
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-6 shadow-soft dark:border-primary/30 dark:bg-primary/10 sm:p-8">
              <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><span className="text-xs font-black uppercase">Job summary</span></div>
              <p className="mt-4 text-base leading-8 text-text-main dark:text-slate-100">{jobSummary}</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {jobHighlights.map((highlight) => <li key={highlight} className="flex items-start gap-2 text-sm font-semibold text-text-muted dark:text-slate-300"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />{highlight}</li>)}
              </ul>
            </section>
            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">Role overview</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-text-muted dark:text-slate-300">{job.description || "The employer will share complete role details during the hiring process."}</p>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">Responsibilities</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-text-muted dark:text-slate-300">{responsibilities || "Responsibilities will be discussed with shortlisted candidates."}</p>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">Requirements</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-text-muted dark:text-slate-300">{job.requirements || "Requirements will be shared during screening."}</p>
              {skills.length ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
                </div>
              ) : null}
              <div className="mt-6 grid gap-4 border-t border-border pt-6 dark:border-white/10 sm:grid-cols-2">
                <div><h3 className="font-black text-text-main dark:text-white">Required skills summary</h3><p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">{requiredSkillsSummary}</p></div>
                <div><h3 className="font-black text-text-main dark:text-white">Preferred skills summary</h3><p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">{preferredSkillsSummary}</p></div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">Ideal candidate</h2>
              <p className="mt-4 text-base leading-8 text-text-muted dark:text-slate-300">{idealCandidate}</p>
            </section>

            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">Benefits</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-text-muted dark:text-slate-300">{job.benefits || "Compensation and benefits will be discussed during the hiring process."}</p>
            </section>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900">
              <h2 className="text-lg font-black text-text-main dark:text-white">Job details</h2>
              <dl className="mt-5 space-y-5">
                <div><dt className="flex items-center gap-2 text-xs font-black uppercase text-text-muted"><Building2 className="h-4 w-4 text-primary" />Company</dt><dd className="mt-1.5 font-bold text-text-main dark:text-white"><Link href={companyPath} className="hover:text-primary hover:underline">{job.company_name || "Confidential employer"}</Link></dd></div>
                <div><dt className="flex items-center gap-2 text-xs font-black uppercase text-text-muted"><Banknote className="h-4 w-4 text-primary" />Salary</dt><dd className="mt-1.5 font-bold text-text-main dark:text-white">{formatSalary(job)}</dd></div>
                <div><dt className="flex items-center gap-2 text-xs font-black uppercase text-text-muted"><Clock3 className="h-4 w-4 text-primary" />Experience</dt><dd className="mt-1.5 font-bold text-text-main dark:text-white">{job.experience_level || job.job_level || "Flexible"}</dd></div>
                <div><dt className="flex items-center gap-2 text-xs font-black uppercase text-text-muted"><MapPin className="h-4 w-4 text-primary" />Location</dt><dd className="mt-1.5 font-bold text-text-main dark:text-white">{job.job_location || "Flexible"}</dd></div>
                <div><dt className="flex items-center gap-2 text-xs font-black uppercase text-text-muted"><CalendarDays className="h-4 w-4 text-primary" />Deadline</dt><dd className="mt-1.5 font-bold text-text-main dark:text-white">{formatDate(job.last_date, "Open until filled")}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5 dark:border-white/10">
                <Link href={categoryPath} className="text-sm font-bold text-primary hover:underline">More {job.category} jobs</Link>
                <Link href={locationPath} className="text-sm font-bold text-primary hover:underline">Jobs in {job.job_location || "this location"}</Link>
              </div>
              {expired ? (
                <span className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-200 px-5 py-3.5 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Applications closed</span>
              ) : (
                <LinkButton href={`/jobs?job=${encodeURIComponent(job.id)}`} className="mt-6 w-full gap-2 py-3.5">
                  <Send className="h-4 w-4" />Apply now
                </LinkButton>
              )}
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 dark:border-primary/30 dark:bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-black text-text-main dark:text-white">Prepare before applying</h2>
              <p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">Review the required skills and update your candidate profile for stronger matching.</p>
            </div>
          </aside>
        </div>

        {relatedJobs.length ? (
          <section className="mt-14 border-t border-border pt-10 dark:border-white/10">
            <div className="flex items-end justify-between gap-4">
              <div><Badge variant="primary">Related jobs</Badge><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Similar opportunities</h2></div>
              <Link href="/jobs" className="text-sm font-bold text-primary hover:underline">View all jobs</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedJobs.map((related) => (
                <Link key={related.id} href={`/jobs/${getCanonicalJobSlug(related)}`} className="group rounded-lg border border-border bg-surface p-5 shadow-soft transition hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-slate-900">
                  <p className="text-xs font-black uppercase text-primary">{related.category}</p>
                  <h3 className="mt-2 text-lg font-black text-text-main group-hover:text-primary dark:text-white">{related.job_title}</h3>
                  <p className="mt-2 text-sm font-semibold text-text-muted dark:text-slate-300">{related.company_name || "Confidential employer"}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm text-text-muted dark:text-slate-300"><MapPin className="h-4 w-4" />{related.job_location || "Flexible"}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm font-bold text-primary">View job <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-5 text-sm font-semibold text-text-muted dark:border-success/25 dark:bg-success/10 dark:text-slate-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          Apply only through the official MXVL workflow. Never share passwords or account access with an employer.
        </div>
      </Container>
    </main>
  );
}
