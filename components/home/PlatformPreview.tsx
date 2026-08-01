"use client";

import { useState } from "react";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, LayoutDashboard, MessageSquare, Network, Radar, UsersRound, type LucideIcon } from "lucide-react";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import FadeInSection from "./FadeInSection";
import { cn } from "@/lib/cn";

type Surface = {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  modules: Array<{ label: string; detail: string }>;
};

const surfaces: Surface[] = [
  { id: "candidate", label: "Candidate", title: "Candidate Workspace", description: "A single place to improve a profile, manage applications, prepare for interviews, and follow every next step.", icon: LayoutDashboard, href: "/candidate", modules: [{ label: "Profile and resume", detail: "Evidence and completion guidance" }, { label: "Application journey", detail: "Status, messages, and interviews" }, { label: "Career preparation", detail: "Role-specific interview practice" }] },
  { id: "employer", label: "Employer", title: "Employer Workspace", description: "Jobs, candidates, hiring activity, subscription usage, and team actions stay visible in one command center.", icon: BriefcaseBusiness, href: "/employer", modules: [{ label: "Hiring overview", detail: "Jobs, applicants, and priorities" }, { label: "Candidate review", detail: "Evidence-backed comparison" }, { label: "Team workflow", detail: "Recruiters, tasks, and usage" }] },
  { id: "ats", label: "ATS", title: "Enterprise ATS", description: "Move candidates through structured stages while preserving notes, interviews, tasks, offers, and an immutable activity trail.", icon: Network, href: "/employer#pipeline", modules: [{ label: "Pipeline", detail: "Configurable hiring stages" }, { label: "Interview workflow", detail: "Scheduling and scorecards" }, { label: "Offers", detail: "Approvals, versions, and status" }] },
  { id: "crm", label: "Talent CRM", title: "Talent Relationship Workspace", description: "Rediscover previous applicants, organize reusable talent pools, and nurture promising people before the next role opens.", icon: UsersRound, href: "/employer/talent-crm", modules: [{ label: "Talent pools", detail: "Reusable candidate communities" }, { label: "Rediscovery", detail: "Evidence-led candidate search" }, { label: "Engagement", detail: "History, status, and follow-up" }] },
  { id: "ai", label: "AI Workspace", title: "Explainable AI Workspace", description: "One entry point to existing matching, resume analysis, job optimization, interview preparation, and candidate intelligence.", icon: Bot, href: "/candidate", modules: [{ label: "Daily Brief", detail: "Signals and one next action" }, { label: "Evidence reasoning", detail: "Observations and confidence" }, { label: "Human review", detail: "Recommendations remain editable" }] },
  { id: "operations", label: "Operations", title: "Operations Intelligence", description: "Monitor product health, adoption, support, recruitment operations, and beta readiness without blocking frontline work.", icon: Radar, href: "/admin/operations-intelligence", modules: [{ label: "Platform health", detail: "Operational signals and errors" }, { label: "Adoption", detail: "Activation and workflow usage" }, { label: "Support operations", detail: "Tickets, chat, and service load" }] }
];

export default function PlatformPreview() {
  const [activeId, setActiveId] = useState(surfaces[0].id);
  const active = surfaces.find((surface) => surface.id === activeId) || surfaces[0];
  const ActiveIcon = active.icon;

  return (
    <FadeInSection className="section-soft py-16 md:py-24">
      <div className="section-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">Explore the operating system</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Six workspaces. One recruitment context.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">Switch between the product surfaces to see where each part of the recruitment journey lives and how it connects.</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] dark:border-white/10 dark:bg-slate-900">
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 p-3 dark:border-white/10" role="tablist" aria-label="MXVL product workspaces">
            {surfaces.map((surface) => {
              const Icon = surface.icon;
              const selected = surface.id === active.id;
              return <button key={surface.id} type="button" role="tab" aria-selected={selected} aria-controls="mxvl-product-preview" onClick={() => setActiveId(surface.id)} className={cn("focus-ring inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-black transition", selected ? "bg-blue-600 text-white shadow-soft" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white")}><Icon className="h-4 w-4" />{surface.label}</button>;
            })}
          </div>

          <div id="mxvl-product-preview" role="tabpanel" className="grid min-h-[430px] lg:grid-cols-[0.75fr_1.25fr]">
            <div className="flex flex-col justify-center border-b border-slate-200 p-6 dark:border-white/10 lg:border-b-0 lg:border-r lg:p-9">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-glow"><ActiveIcon className="h-6 w-6" /></span>
              <p className="mt-6 text-xs font-black uppercase text-blue-600 dark:text-blue-300">{active.label} product surface</p>
              <h3 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{active.title}</h3>
              <p className="mt-4 text-sm font-semibold leading-7 text-slate-600 dark:text-slate-300">{active.description}</p>
              <LinkButton href={active.href} variant="secondary" className="mt-7 w-fit">Open this workspace <ArrowRight className="h-4 w-4" /></LinkButton>
            </div>

            <div className="relative overflow-hidden bg-slate-50 p-5 dark:bg-slate-950 sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_42%)]" aria-hidden="true" />
              <div className="relative h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-white/10 dark:bg-slate-900 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10"><div><p className="text-[10px] font-black uppercase text-slate-400">MXVL workspace</p><p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{active.title}</p></div><Badge variant="success">Connected</Badge></div>
                <div className="mt-5 grid gap-3">
                  {active.modules.map((module, index) => <div key={module.label} className="flex min-h-20 items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]"><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", index === 0 ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10" : index === 1 ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10")}><CheckCircle2 className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-black text-slate-950 dark:text-white">{module.label}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{module.detail}</p></div>{index < active.modules.length - 1 ? <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-300 sm:block" /> : <MessageSquare className="ml-auto hidden h-4 w-4 text-emerald-500 sm:block" />}</div>)}
                </div>
                <p className="mt-5 text-center text-[10px] font-bold uppercase text-slate-400">Production capability map. No simulated performance data.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </FadeInSection>
  );
}
