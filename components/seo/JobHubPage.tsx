import Link from "next/link";
import { BriefcaseBusiness, Building2, ChevronRight, MapPin } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Container from "@/components/layout/Container";
import { getCanonicalJobSlug, buildJobSlug } from "@/lib/jobSeo";
import type { PublicJobRecord } from "@/lib/jobSeoData";
import type { PopularCompany, SeoHubLink } from "@/lib/seoHubData";

type JobHubPageProps = {
  mode: "category" | "location";
  label: string;
  introduction: string;
  jobs: PublicJobRecord[];
  relatedCategories: SeoHubLink[];
  locations: SeoHubLink[];
  popularCompanies: PopularCompany[];
};

export default function JobHubPage({ mode, label, introduction, jobs, relatedCategories, locations, popularCompanies }: JobHubPageProps) {
  return (
    <main className="bg-bg pb-20 dark:bg-slate-950">
      <section className="border-b border-border bg-surface py-12 dark:border-white/10 dark:bg-slate-900 sm:py-16">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-muted dark:text-slate-300">
            <Link href="/" className="hover:text-primary">Home</Link><ChevronRight className="h-4 w-4" />
            <Link href="/jobs" className="hover:text-primary">Jobs</Link><ChevronRight className="h-4 w-4" />
            <span aria-current="page" className="text-text-main dark:text-white">{label}</span>
          </nav>
          <Badge variant="primary">{mode === "category" ? "Career category" : "Job location"}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main dark:text-white sm:text-5xl">{mode === "category" ? `${label} Jobs` : `Jobs in ${label}`}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-text-muted dark:text-slate-300">{introduction}</p>
          <p className="mt-4 text-sm font-bold text-primary">{jobs.length} active {jobs.length === 1 ? "opportunity" : "opportunities"}</p>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-labelledby="job-list-heading">
            <h2 id="job-list-heading" className="text-2xl font-black text-text-main dark:text-white">Current opportunities</h2>
            <div className="mt-5 grid gap-4">
              {jobs.length ? jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${getCanonicalJobSlug(job)}`} className="group rounded-lg border border-border bg-surface p-5 shadow-soft transition hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-slate-900 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="text-xl font-black text-text-main group-hover:text-primary dark:text-white">{job.job_title}</h3><p className="mt-2 font-semibold text-text-muted dark:text-slate-300">{job.company_name || "Confidential employer"}</p></div>
                    <Badge>{job.employment_type || job.job_type || "Employment"}</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-text-muted dark:text-slate-300">
                    <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{job.job_location || "Flexible"}</span>
                    <span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-primary" />{job.experience_level || job.job_level || "Flexible experience"}</span>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary">View job <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              )) : (
                <div className="rounded-lg border border-border bg-surface p-8 text-center dark:border-white/10 dark:bg-slate-900"><p className="font-bold text-text-muted dark:text-slate-300">No active jobs are available here right now.</p><Link href="/jobs" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">Browse all jobs</Link></div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <HubLinks title="Related categories" links={relatedCategories} basePath="/jobs/category" />
            <HubLinks title="Popular locations" links={locations} basePath="/jobs/location" />
            <div className="rounded-lg border border-border bg-surface p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
              <h2 className="font-black text-text-main dark:text-white">Popular companies</h2>
              <div className="mt-4 grid gap-3">
                {popularCompanies.map((company) => <Link key={company.employerId} href={`/company/${buildJobSlug(company.name, company.employerId)}`} className="flex items-center justify-between gap-3 text-sm font-bold text-text-muted hover:text-primary dark:text-slate-300"><span className="flex min-w-0 items-center gap-2"><Building2 className="h-4 w-4 shrink-0" /><span className="truncate">{company.name}</span></span><span>{company.count}</span></Link>)}
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}

function HubLinks({ title, links, basePath }: { title: string; links: SeoHubLink[]; basePath: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-soft dark:border-white/10 dark:bg-slate-900">
      <h2 className="font-black text-text-main dark:text-white">{title}</h2>
      <div className="mt-4 grid gap-3">
        {links.map((link) => <Link key={link.slug} href={`${basePath}/${link.slug}`} className="flex items-center justify-between gap-3 text-sm font-bold text-text-muted hover:text-primary dark:text-slate-300"><span>{link.label}</span><span>{link.count}</span></Link>)}
      </div>
    </div>
  );
}
