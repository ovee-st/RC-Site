import type { Metadata } from "next";
import TalentCrmWorkspace from "@/components/crm/TalentCrmWorkspace";

export const metadata: Metadata = { title: "Talent CRM", robots: { index: false, follow: false } };

export default function EmployerTalentCrmPage() {
  return <TalentCrmWorkspace />;
}
