"use client";

import { BriefcaseBusiness, CheckCircle2, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const candidateBenefits = ["AI Job Recommendations", "Resume Builder", "Career Growth", "Interview Preparation", "Application Tracking"];
const employerBenefits = ["Candidate Matching", "Hiring Analytics", "Managed Recruitment", "Talent Pool Access", "Faster Hiring"];

function BenefitColumn({ title, items, type }: { title: string; items: string[]; type: "candidate" | "employer" }) {
  const candidate = type === "candidate";
  return (
    <Card variant="interactive" className="h-full rounded-3xl p-7">
      <div className={`grid h-12 w-12 place-items-center rounded-2xl text-white ${candidate ? "bg-blue-600" : "bg-emerald-600"}`}>
        {candidate ? <UserRound /> : <BriefcaseBusiness />}
      </div>
      <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <CheckCircle2 className={`h-4 w-4 shrink-0 ${candidate ? "text-blue-600" : "text-emerald-600"}`} />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ProblemSolution() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary">Why MXVL</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Built for both sides of every great hire.</h2>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <BenefitColumn title="Why Candidates Choose MXVL" items={candidateBenefits} type="candidate" />
          <BenefitColumn title="Why Employers Choose MXVL" items={employerBenefits} type="employer" />
        </div>
      </Container>
    </FadeInSection>
  );
}
