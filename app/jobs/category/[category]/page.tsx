import type { Metadata } from "next";
import JobHubPage from "@/components/seo/JobHubPage";
import { getCategoryHub } from "@/lib/seoHubData";
import { generateBreadcrumbSchema, serializeJsonLd } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type CategoryPageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const hub = await getCategoryHub(category);
  const title = `${hub.label} Jobs`;
  const description = `Explore active ${hub.label} jobs, hiring companies, popular locations, and related career categories on ${SITE_NAME}.`;
  const canonical = `/jobs/category/${category}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, siteName: SITE_NAME },
    twitter: { card: "summary", title, description }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const hub = await getCategoryHub(category);
  const canonicalUrl = new URL(`/jobs/category/${category}`, SITE_URL).toString();
  const breadcrumb = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL.toString() },
    { name: "Jobs", url: new URL("/jobs", SITE_URL).toString() },
    { name: `${hub.label} Jobs`, url: canonicalUrl }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }} />
      <JobHubPage
        mode="category"
        label={hub.label}
        introduction={`Find ${hub.label} opportunities across established employers and growing teams. Compare locations, experience requirements, employment types, and skills before applying through MX Venture Lab.`}
        jobs={hub.jobs}
        relatedCategories={hub.relatedCategories}
        locations={hub.locations}
        popularCompanies={hub.popularCompanies}
      />
    </>
  );
}
