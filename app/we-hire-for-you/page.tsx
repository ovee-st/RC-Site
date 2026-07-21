import type { Metadata } from "next";
import ManagedHiringPage from "@/components/hiring/ManagedHiringPage";
import { PRIVATE_ROBOTS, SITE_NAME, SITE_URL } from "@/lib/seo";
import { generateServiceSchema, serializeJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Managed Hiring Services",
  description: "Employer-only white collar, blue collar, bulk hiring, and executive search services delivered by MX Venture Lab.",
  alternates: { canonical: "/we-hire-for-you" },
  robots: PRIVATE_ROBOTS
};

export default function WeHireForYouPage() {
  const serviceSchema = generateServiceSchema({
    name: "MXVL Managed Hiring Services",
    description: metadata.description as string,
    url: new URL("/we-hire-for-you", SITE_URL).toString(),
    serviceType: ["Managed Hiring", "White Collar Hiring", "Blue Collar Hiring", "Bulk Hiring", "Executive Search"],
    provider: { name: SITE_NAME, url: SITE_URL.toString() },
    audience: ["Employers", "Recruitment teams"],
    areaServed: "Worldwide"
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceSchema) }} />
      <ManagedHiringPage />
    </>
  );
}
