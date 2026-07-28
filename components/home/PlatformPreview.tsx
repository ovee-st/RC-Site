"use client";

import { Bot, BriefcaseBusiness, Building2, LayoutDashboard, Network, UsersRound } from "lucide-react";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import FadeInSection from "./FadeInSection";

const capabilities = [
  { title: "AI Recruiting", text: "Bring relevant candidates into focus with explainable fit signals.", icon: Bot, tone: "violet" as const },
  { title: "Enterprise ATS", text: "Keep applications, interviews, decisions, and offers moving in one workflow.", icon: Network, tone: "blue" as const },
  { title: "Talent CRM", text: "Build relationships with promising people before the next role opens.", icon: UsersRound, tone: "emerald" as const },
  { title: "Candidate Workspace", text: "Manage profiles, applications, preparation, and career progress clearly.", icon: LayoutDashboard, tone: "cyan" as const },
  { title: "Employer Workspace", text: "Coordinate jobs, recruiters, shortlists, communication, and hiring progress.", icon: BriefcaseBusiness, tone: "emerald" as const },
  { title: "Business Solutions", text: "Add practical support for technology, operations, facilities, and delivery.", icon: Building2, tone: "amber" as const }
];

export default function PlatformPreview() {
  return (
    <FadeInSection className="section-soft py-16 md:py-24">
      <div className="section-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">One connected platform</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">More than a job board. A system for every hiring relationship.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Start with the workspace you need today and keep the context required for better career and hiring decisions tomorrow.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ title, text, icon: Icon, tone }) => (
            <Card key={title} variant="interactive" className="group h-full rounded-2xl p-6">
              <IconTile tone={tone}>
                <Icon className="h-5 w-5" />
              </IconTile>
              <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
