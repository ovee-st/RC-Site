import type { Metadata } from "next";
import FinalCTA from "@/components/home/FinalCTA";
import HiringPaths from "@/components/home/HiringPaths";
import ServiceCategories from "@/components/home/ServiceCategories";

export const metadata: Metadata = {
  title: "We Hire for You | MX Venture Lab",
  description: "Managed hiring support from MX Venture Lab for white collar, blue collar, promoter, remote, contract, and executive roles."
};

export default function WeHireForYouPage() {
  return (
    <main className="overflow-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <HiringPaths />
      <ServiceCategories />
      <FinalCTA />
    </main>
  );
}
