import type { Metadata } from "next";
import PricingPlans from "@/components/subscriptions/PricingPlans";

export const metadata: Metadata = {
  title: "Employer Plans & AI Hiring Subscriptions",
  description: "Find, screen, and hire top talent faster with MXVL employer subscription plans, AI matching, billing tools, and hiring analytics.",
  alternates: { canonical: "/subscriptions" }
};

export default function SubscriptionsPage() {
  return <PricingPlans />;
}
