"use client";

import { useSearchParams } from "next/navigation";
import Container from "@/components/layout/Container";
import JobInterviewPreparation from "@/components/candidate/JobInterviewPreparation";

export default function CandidateInterviewPreparationPage() {
  const searchParams = useSearchParams();
  return <Container className="py-8 sm:py-10"><JobInterviewPreparation initialJobId={searchParams.get("job") || ""} /></Container>;
}
