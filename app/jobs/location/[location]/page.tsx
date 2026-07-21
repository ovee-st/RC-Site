import type { Metadata } from "next";
import JobHubPage from "@/components/seo/JobHubPage";
import { getLocationHub } from "@/lib/seoHubData";
import { generateBreadcrumbSchema, serializeJsonLd } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type LocationPageProps = { params: Promise<{ location: string }> };

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { location } = await params;
  const hub = await getLocationHub(location);
  const title = `Jobs in ${hub.label}`;
  const description = `Browse active jobs in ${hub.label}, popular employers, career categories, and related hiring locations on ${SITE_NAME}.`;
  const canonical = `/jobs/location/${location}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, siteName: SITE_NAME },
    twitter: { card: "summary", title, description }
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { location } = await params;
  const hub = await getLocationHub(location);
  const canonicalUrl = new URL(`/jobs/location/${location}`, SITE_URL).toString();
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL.toString() },
    { name: "Jobs", url: new URL("/jobs", SITE_URL).toString() },
    { name: `Jobs in ${hub.label}`, url: canonicalUrl }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }} />
      <JobHubPage
        mode="location"
        label={hub.label}
        introduction={`Explore current roles in ${hub.label} across multiple industries and experience levels. Review employers, skills, categories, and application details in one focused job market page.`}
        jobs={hub.jobs}
        relatedCategories={hub.relatedCategories}
        locations={hub.locations}
        popularCompanies={hub.popularCompanies}
      />
    </>
  );
}
