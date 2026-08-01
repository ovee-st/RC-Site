"use client";

import { BadgeCheck, BriefcaseBusiness, FileSearch, FileText, Handshake, MessagesSquare, SearchCheck, Sparkles, Target, TrendingUp, UserCheck, UserRound, UsersRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";
import BrandFlow from "./BrandFlow";

const candidateJourney = [
  { label: "Create profile", detail: "Present experience", icon: UserRound },
  { label: "Resume analysis", detail: "Find evidence gaps", icon: FileSearch },
  { label: "Job matching", detail: "See fit signals", icon: Target },
  { label: "Apply", detail: "Track progress", icon: FileText },
  { label: "Prepare", detail: "Practice by role", icon: Sparkles },
  { label: "Interview", detail: "Move with context", icon: MessagesSquare },
  { label: "Career growth", detail: "Choose the right offer", icon: TrendingUp }
];

const employerJourney = [
  { label: "Create job", detail: "Define the need", icon: BriefcaseBusiness },
  { label: "Optimize", detail: "Improve job clarity", icon: Sparkles },
  { label: "Rank talent", detail: "Review evidence", icon: SearchCheck },
  { label: "Shortlist", detail: "Keep decisions visible", icon: UserCheck },
  { label: "Interview", detail: "Coordinate the team", icon: UsersRound },
  { label: "Offer and hire", detail: "Close with control", icon: BadgeCheck },
  { label: "Talent CRM", detail: "Nurture future talent", icon: Handshake }
];

export default function HowItWorks() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 max-w-3xl">
          <Badge variant="primary">How MXVL works</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">See the whole journey before you begin.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">MXVL keeps the work before, during, and after a hiring decision connected for both sides.</p>
        </div>
        <div className="grid gap-6">
          <Card className="rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><UserRound className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase text-blue-600 dark:text-blue-300">Candidate journey</p><h3 className="text-lg font-black text-slate-950 dark:text-white">From profile to career progress</h3></div></div>
            <BrandFlow steps={candidateJourney} tone="blue" />
          </Card>
          <Card className="rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white"><BriefcaseBusiness className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">Employer journey</p><h3 className="text-lg font-black text-slate-950 dark:text-white">From hiring need to lasting talent relationship</h3></div></div>
            <BrandFlow steps={employerJourney} tone="emerald" />
          </Card>
        </div>
      </Container>
    </FadeInSection>
  );
}
