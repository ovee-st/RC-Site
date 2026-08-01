"use client";

import { BadgeCheck, BrainCircuit, FileSearch, Scale, ShieldCheck, UserCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";
import BrandFlow from "./BrandFlow";

const reasoningFlow = [
  { label: "Observation", detail: "What the record contains", icon: FileSearch },
  { label: "Evidence", detail: "The source behind the signal", icon: BadgeCheck },
  { label: "Confidence", detail: "How complete the evidence is", icon: BrainCircuit },
  { label: "Recommendation", detail: "A reviewable next step", icon: ShieldCheck },
  { label: "Human decision", detail: "A person chooses the outcome", icon: UserCheck }
];

const trustPrinciples = [
  { title: "No hidden conclusion", text: "Recommendations show their supporting signals and unknowns." },
  { title: "No automatic hiring decision", text: "Recruiters review, edit, accept, or reject every recommendation." },
  { title: "No certainty theater", text: "MXVL distinguishes recorded observations, estimates, and recommendations." }
];

export default function MatchScoring() {
  return (
    <FadeInSection className="section-radial py-16 md:py-24">
      <Container>
        <Card className="overflow-hidden rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge variant="success"><Scale className="mr-1 h-3.5 w-3.5" /> Explainable AI, human decision</Badge>
              <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">See how a recommendation is formed.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">MXVL organizes available evidence and proposes a next step. It also shows uncertainty, so candidates and employers can judge the recommendation rather than simply trust a score.</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-500/5 sm:p-5"><BrandFlow steps={reasoningFlow} tone="violet" compact /></div>
          </div>
          <div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 dark:border-white/10 md:grid-cols-3">
            {trustPrinciples.map((principle) => <div key={principle.title} className="rounded-xl bg-slate-50 p-4 dark:bg-white/[0.04]"><h3 className="text-sm font-black text-slate-950 dark:text-white">{principle.title}</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">{principle.text}</p></div>)}
          </div>
        </Card>
      </Container>
    </FadeInSection>
  );
}
