import type { Metadata } from "next";
import JobImporter from "@/components/jobs/JobImporter";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Job Importer",
  description: "Import and review a job before publishing it through the MXVL employer workflow.",
  robots: PRIVATE_ROBOTS
};

export default function EmployerJobImportPage() {
  return <JobImporter />;
}

