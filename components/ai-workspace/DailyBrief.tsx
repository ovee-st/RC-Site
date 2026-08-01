"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, BriefcaseBusiness, CalendarClock, FileSearch, Sparkles, Target, UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { buildCandidateDailyBrief, buildEmployerDailyBrief, type CandidatePortalSnapshot, type InsightKind } from "@/lib/ai/dailyBrief";
import type { ProfileAnalysisInput } from "@/lib/ai/profile-analysis";
import type { RecruiterDashboardDto } from "@/types/ats";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { LinkButton } from "@/components/ui/Button";

type DailyBriefProps = {
  role: "candidate" | "employer";
  profile?: ProfileAnalysisInput;
};

const insightVariants: Record<InsightKind, "primary" | "success" | "neutral" | "danger"> = {
  Observation: "neutral",
  Recommendation: "primary",
  Estimate: "success",
  Prediction: "danger"
};

const capabilityLinks = {
  candidate: [
    { label: "Resume analysis", detail: "Open the existing resume and ATS workspace.", href: "/candidate?tab=resume", icon: FileSearch },
    { label: "Job matching", detail: "Review current explainable role matches.", href: "/jobs", icon: Target },
    { label: "Interview preparation", detail: "Continue job-specific interview practice.", href: "/candidate?tab=interview-prep", icon: CalendarClock }
  ],
  employer: [
    { label: "Candidate intelligence", detail: "Review evidence-based candidate insights.", href: "/employer/candidates", icon: UsersRound },
    { label: "AI job importer", detail: "Turn an existing job description into a draft.", href: "/dashboard/employer/jobs/import", icon: BriefcaseBusiness },
    { label: "Talent rediscovery", detail: "Search and nurture existing talent relationships.", href: "/employer/talent-crm", icon: BrainCircuit }
  ]
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DailyBrief({ role, profile = {} }: DailyBriefProps) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<CandidatePortalSnapshot | RecruiterDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataAvailable, setDataAvailable] = useState(false);
  const greeting = typeof window === "undefined" ? "Welcome back" : greetingForHour(new Date().getHours());

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8_000);

    async function loadExistingWorkspaceData() {
      try {
        const headers = await compactAuthHeaders("daily_brief");
        if (!headers.Authorization) return;
        const endpoint = role === "candidate" ? "/api/candidate-portal" : "/api/dashboard/recruiter";
        const response = await fetch(endpoint, { headers, signal: controller.signal, cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (!active) return;
        setSnapshot(payload);
        setDataAvailable(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Daily Brief could not load an existing workspace data source.", error);
      } finally {
        if (active) setLoading(false);
        window.clearTimeout(timeout);
      }
    }

    void loadExistingWorkspaceData();
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [role]);

  const brief = useMemo(() => role === "candidate"
    ? buildCandidateDailyBrief(profile, dataAvailable ? snapshot as CandidatePortalSnapshot : null)
    : buildEmployerDailyBrief(dataAvailable ? snapshot as RecruiterDashboardDto : null), [dataAvailable, profile, role, snapshot]);
  const firstName = (user?.name || user?.user_metadata?.name || user?.user_metadata?.full_name || "there").trim().split(/\s+/)[0];

  return (
    <section aria-labelledby="daily-brief-title" className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 bg-gradient-to-br from-primary/12 via-surface to-success/10 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] dark:via-slate-950">
          <div>
            <Badge variant="primary" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> AI Daily Brief</Badge>
            <p className="mt-4 text-sm font-bold text-primary" suppressHydrationWarning>{greeting}, {firstName}</p>
            <h1 id="daily-brief-title" className="type-h1 mt-1">{brief.title}</h1>
            <p className="type-body mt-3 max-w-3xl">{brief.summary}</p>
          </div>
          <div className="rounded-card border border-primary/15 bg-white/75 p-4 shadow-soft backdrop-blur dark:bg-white/5">
            <p className="type-label">Suggested next action</p>
            <h2 className="type-h3 mt-2">{brief.primaryAction.label}</h2>
            <p className="type-body mt-2 text-sm">{brief.primaryAction.reason}</p>
            <LinkButton href={brief.primaryAction.href} className="mt-4 w-full justify-between">
              {brief.primaryAction.label}<ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card aria-busy={loading}>
          <div className="flex items-center justify-between gap-3">
            <div><p className="type-label">What happened</p><h2 className="type-h3 mt-1">Signals requiring attention</h2></div>
            {loading ? <Badge variant="neutral">Updating</Badge> : <Badge variant={dataAvailable ? "success" : "neutral"}>{dataAvailable ? "Live records" : "Profile guidance"}</Badge>}
          </div>
          {loading ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {brief.items.map((item) => (
                <div key={item.id} className="rounded-card border border-border bg-bg/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-text-main dark:text-white">{item.label}</p><Badge variant={insightVariants[item.kind]}>{item.kind}</Badge></div>
                  <p className="mt-3 text-xl font-black tracking-tight text-text-main dark:text-white">{item.value}</p>
                  <p className="type-body mt-2 text-xs leading-5">{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="type-label">Daily progress</p>
          <h2 className="type-h3 mt-1">Momentum at a glance</h2>
          <div className="mt-5 space-y-4">
            {brief.progress.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-text-main dark:text-white">{item.label}</span><span className="font-black text-primary">{item.value}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-primary to-success" style={{ width: `${item.value}%` }} /></div>
                <p className="mt-1.5 text-xs leading-5 text-text-muted dark:text-slate-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div><p className="type-label">AI Workspace</p><h2 className="type-h3 mt-1">Continue with an existing AI capability</h2><p className="type-body mt-2">These actions open the platform&apos;s current tools. The Daily Brief does not recreate their analysis.</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {capabilityLinks[role].map((item) => {
            const Icon = item.icon;
            return <Link key={item.label} href={item.href} className="focus-ring group rounded-card border border-border bg-bg/70 p-4 transition hover:border-primary/30 hover:bg-primary/5 dark:border-white/10 dark:bg-white/5"><Icon className="h-5 w-5 text-primary" /><h3 className="mt-3 text-sm font-black text-text-main group-hover:text-primary dark:text-white">{item.label}</h3><p className="mt-1 text-xs leading-5 text-text-muted dark:text-slate-400">{item.detail}</p></Link>;
          })}
        </div>
      </Card>
    </section>
  );
}
