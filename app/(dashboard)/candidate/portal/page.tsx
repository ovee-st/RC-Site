import type { Metadata } from "next";
import CandidatePortal from "@/components/crm/CandidatePortal";

export const metadata: Metadata = { title: "Candidate Portal", robots: { index: false, follow: false } };

export default function CandidatePortalPage() {
  return <CandidatePortal />;
}
