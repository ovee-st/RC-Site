"use client";

import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const paths = [
  { title: "For Candidates", icon: UserRound, cta: "Explore Careers", href: "/jobs", points: ["AI Job Matching", "Career Dashboard", "Resume Builder", "Application Tracking"] },
  { title: "For Employers", icon: BriefcaseBusiness, cta: "Start Hiring", href: "/login", points: ["AI Candidate Matching", "Managed Hiring", "Job Posting", "Talent Search"] }
];

export default function HiringPaths() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-8 text-center">
          <Badge variant="primary">Two paths. One platform.</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-4xl">Choose the path that matches your goal.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {paths.map((path) => (
            <Card key={path.title} variant="interactive" className="relative overflow-hidden rounded-3xl p-7">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg"><path.icon /></div>
              <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{path.title}</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {path.points.map((point) => <div key={point} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{point}</div>)}
              </div>
              <LinkButton href={path.href} className="mt-6 rounded-2xl">{path.cta}<ArrowRight className="ml-2 h-4 w-4" /></LinkButton>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
