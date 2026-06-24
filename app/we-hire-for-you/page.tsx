import type { Metadata } from "next";
import ManagedHiringPage from "@/components/hiring/ManagedHiringPage";

export const metadata: Metadata = {
  title: "Managed Hiring Services | MX Venture Lab",
  description: "Employer-only white collar, blue collar, bulk hiring, and executive search services delivered by MX Venture Lab."
};

export default function WeHireForYouPage() {
  return <ManagedHiringPage />;
}
