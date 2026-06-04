import type { Metadata } from "next";
import PricingPlans from "@/components/subscriptions/PricingPlans";

export const metadata: Metadata = {
  title: "MXVL Employer Plans | AI Hiring Subscriptions",
  description: "Find, screen, and hire top talent faster with MXVL employer subscription plans, AI matching, billing tools, and hiring analytics."
};

export default function SubscriptionsPage() {
  return <PricingPlans />;
}
