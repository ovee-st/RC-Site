import type { Metadata } from "next";
import { faqItems } from "@/lib/faqContent";
import { generateFaqSchema, serializeJsonLd } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Find answers about MX Venture Lab candidate accounts, employer subscriptions, payments, job applications, and account management.",
  alternates: {
    canonical: "/help-center"
  }
};

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateFaqSchema(faqItems)) }} />
      {children}
    </>
  );
}
