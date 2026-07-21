import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Building2, CheckCircle2, ChevronRight, ExternalLink, Factory, MapPin } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Container from "@/components/layout/Container";
import { buildJobSlug, getCanonicalJobSlug } from "@/lib/jobSeo";
import { getCompanyPageData } from "@/lib/seoHubData";
import { generateBreadcrumbSchema, generateCompanySchema, serializeJsonLd } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type CompanyPageProps = { params: Promise<{ slug: string }> };

function companyIdentifier(company: { id: string; user_id: string | null }) {
  return company.user_id || company.id;
}

function companyDescription(company: { company_name: string; about: string | null; industry: string | null; location: string | null }) {
  return company.about || `Explore open jobs at ${company.company_name}${company.industry ? ` in ${company.industry}` : ""}${company.location ? `, based in ${company.location}` : ""}.`;
}

function safeWebsiteUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCompanyPageData(slug);
  if (!data) return { title: "Company Not Found", robots: { index: false, follow: false } };

  const { company } = data;
  const canonicalSlug = buildJobSlug(company.company_name, companyIdentifier(company));
  const canonical = `/company/${canonicalSlug}`;
  const title = `${company.company_name} Jobs & Company Profile`;
  const description = companyDescription(company);
  const image = company.photo_url && /^https?:\/\//i.test(company.photo_url) ? company.photo_url : "/android/icon-512.png";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "profile", url: canonical, title, description, siteName: SITE_NAME, images: [image] },
    twitter: { card: "summary", title, description, images: [image] }
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const data = await getCompanyPageData(slug);
  if (!data) notFound();

  const { company, openJobs, relatedCompanies, categories, locations, benefits } = data;
  const identifier = companyIdentifier(company);
  const canonicalSlug = buildJobSlug(company.company_name, identifier);
  if (slug !== canonicalSlug) permanentRedirect(`/company/${canonicalSlug}`);

  const canonicalUrl = new URL(`/company/${canonicalSlug}`, SITE_URL).toString();
  const website = safeWebsiteUrl(company.website_url);
  const logo = company.photo_url && /^https?:\/\//i.test(company.photo_url) ? company.photo_url : null;
  const organization = generateCompanySchema({
    name: company.company_name,
    url: canonicalUrl,
    description: companyDescription(company),
    logo,
    website,
    industry: company.industry,
    location: company.location
  });
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL.toString() },
    { name: "Companies", url: new URL("/jobs", SITE_URL).toString() },
    { name: company.company_name, url: canonicalUrl }
  ]);

  return (
    <main className="bg-bg pb-20 dark:bg-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }} />

      <section className="border-b border-border bg-surface py-10 dark:border-white/10 dark:bg-slate-900 sm:py-14">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold text-text-muted dark:text-slate-300">
            <Link href="/" className="hover:text-primary">Home</Link><ChevronRight className="h-4 w-4" />
            <Link href="/jobs" className="hover:text-primary">Companies</Link><ChevronRight className="h-4 w-4" />
            <span aria-current="page" className="text-text-main dark:text-white">{company.company_name}</span>
          </nav>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-bg text-2xl font-black text-primary dark:border-white/10 dark:bg-slate-800">
              {logo ? <img src={logo} alt={`${company.company_name} logo`} className="h-full w-full object-cover" /> : company.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="primary">Company profile</Badge>{company.verified ? <Badge variant="success">Verified</Badge> : null}</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-5xl">{company.company_name}</h1>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-text-muted dark:text-slate-300">
                <span className="flex items-center gap-2"><Factory className="h-4 w-4 text-primary" />{company.industry || "Industry not specified"}</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{company.location || "Location not specified"}</span>
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{company.company_size || "Company size not specified"}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
              <h2 className="text-2xl font-black text-text-main dark:text-white">About {company.company_name}</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-8 text-text-muted dark:text-slate-300">{companyDescription(company)}</p>
              {website ? <a href={website} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Visit company website <ExternalLink className="h-4 w-4" /></a> : null}
            </section>

            {benefits.length ? (
              <section className="rounded-lg border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-8">
                <h2 className="text-2xl font-black text-text-main dark:text-white">Benefits</h2>
                <div className="mt-5 grid gap-3">{benefits.map((benefit) => <p key={benefit} className="flex items-start gap-2 whitespace-pre-line text-sm leading-7 text-text-muted dark:text-slate-300"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-success" />{benefit}</p>)}</div>
              </section>
            ) : null}

            <section>
              <div className="flex items-end justify-between gap-4"><div><Badge variant="primary">Open jobs</Badge><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Careers at {company.company_name}</h2></div><span className="text-sm font-bold text-primary">{openJobs.length} active</span></div>
              <div className="mt-5 grid gap-4">
                {openJobs.length ? openJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${getCanonicalJobSlug(job)}`} className="group rounded-lg border border-border bg-surface p-5 shadow-soft transition hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-slate-900">
                    <h3 className="text-lg font-black text-text-main group-hover:text-primary dark:text-white">{job.job_title}</h3>
                    <p className="mt-2 text-sm font-semibold text-text-muted dark:text-slate-300">{job.job_location || "Flexible"} · {job.employment_type || job.job_type || "Employment"}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">View job <ChevronRight className="h-4 w-4" /></span>
                  </Link>
                )) : <div className="rounded-lg border border-border bg-surface p-7 text-center dark:border-white/10 dark:bg-slate-900"><p className="font-bold text-text-muted dark:text-slate-300">No active jobs are listed right now.</p></div>}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <LinkCollection title="Job categories" items={categories.map((item) => ({ label: item.label, href: `/jobs/category/${item.slug}`, count: item.count }))} />
            <LinkCollection title="Hiring locations" items={locations.map((item) => ({ label: item.label, href: `/jobs/location/${item.slug}`, count: item.count }))} />
          </aside>
        </div>

        {relatedCompanies.length ? (
          <section className="mt-14 border-t border-border pt-10 dark:border-white/10">
            <h2 className="text-2xl font-black text-text-main dark:text-white">Related companies</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{relatedCompanies.map((related) => <Link key={related.id} href={`/company/${buildJobSlug(related.company_name, companyIdentifier(related))}`} className="rounded-lg border border-border bg-surface p-5 font-black text-text-main shadow-soft hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-900 dark:text-white">{related.company_name}<p className="mt-2 text-sm font-semibold text-text-muted dark:text-slate-300">{related.industry || related.location || "Company profile"}</p></Link>)}</div>
          </section>
        ) : null}
      </Container>
    </main>
  );
}

function LinkCollection({ title, items }: { title: string; items: Array<{ label: string; href: string; count: number }> }) {
  if (!items.length) return null;
  return <div className="rounded-lg border border-border bg-surface p-5 shadow-soft dark:border-white/10 dark:bg-slate-900"><h2 className="font-black text-text-main dark:text-white">{title}</h2><div className="mt-4 grid gap-3">{items.map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between gap-3 text-sm font-bold text-text-muted hover:text-primary dark:text-slate-300"><span>{item.label}</span><span>{item.count}</span></Link>)}</div></div>;
}
