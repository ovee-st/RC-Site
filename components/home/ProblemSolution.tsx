"use client";

import { ArrowRight, FileSearch, Network, Route } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const stories = [
  { problem: "Recruiters lose time screening without a clear order.", solution: "MXVL organizes candidate evidence and explains fit signals.", outcome: "Teams focus attention on review, interviews, and decisions.", icon: FileSearch, tone: "blue" },
  { problem: "Candidates often cannot see what happened after applying.", solution: "Applications, messages, interviews, and offers stay in one journey.", outcome: "Each person can see the current stage and the next useful action.", icon: Route, tone: "violet" },
  { problem: "Hiring context gets split across tools and conversations.", solution: "ATS, AI, communication, offers, and Talent CRM share one workflow.", outcome: "Decisions remain accountable and promising talent stays connected.", icon: Network, tone: "emerald" }
] as const;

export default function ProblemSolution() {
  return (
    <FadeInSection className="section-radial py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary">Why MXVL</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Turn recruitment friction into visible progress.</h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {stories.map((story) => {
            const Icon = story.icon;
            const iconTone = story.tone === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10" : story.tone === "violet" ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10";
            return (
              <Card key={story.problem} variant="interactive" className="h-full rounded-3xl p-6">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" /></span>
                <p className="mt-5 text-xs font-black uppercase text-slate-400">Problem</p>
                <h3 className="mt-2 text-lg font-black leading-7 text-slate-950 dark:text-white">{story.problem}</h3>
                <div className="my-4 flex items-center gap-2 text-xs font-black text-blue-600"><ArrowRight className="h-4 w-4" />MXVL solution</div>
                <p className="text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{story.solution}</p>
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10"><p className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-300">Outcome</p><p className="mt-2 text-sm font-bold leading-6 text-slate-800 dark:text-slate-200">{story.outcome}</p></div>
              </Card>
            );
          })}
        </div>
      </Container>
    </FadeInSection>
  );
}
