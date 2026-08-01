"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

import RecommendedActions from "@/components/dashboard/RecommendedActions";
import EmployerProfile from "@/components/dashboard/EmployerProfile";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import AccountSettings from "@/components/account/AccountSettings";
import EmployerSubscriptionWidget from "@/components/subscriptions/EmployerSubscriptionWidget";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { useEffect, useMemo, useState } from "react";
import { useJobStore } from "@/store/useJobStore";
import { demoCandidates } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { ChevronDown, Sparkles, UsersRound } from "lucide-react";
import DailyBrief from "@/components/ai-workspace/DailyBrief";

const RecruiterMatches = dynamic(() => import("@/components/dashboard/RecruiterMatches"), {
  loading: () => <DashboardModuleSkeleton label="Loading candidate matches" />
});
const PipelineBoard = dynamic(() => import("@/components/pipeline/PipelineBoard"), {
  loading: () => <DashboardModuleSkeleton label="Loading hiring pipeline" />
});

function DashboardModuleSkeleton({ label }: { label: string }) {
  return <div role="status" aria-live="polite" className="min-h-56 animate-pulse rounded-md bg-slate-100 p-6 text-sm font-bold text-text-muted dark:bg-white/5">{label}...</div>;
}

const EMPLOYER_PANEL_EVENT = "mx-employer-panel-change";

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

export default function EmployerCommandCenter() {
  const [activePanel, setActivePanel] = useState<"home" | "profile" | "account">("home");
  const jobs = useJobStore((state) => state.jobs);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => (job.status || "active") === "active" && !isExpired(job.deadline));
    const hiredJobs = jobs.filter((job) => job.status === "hired");
    const topMatches = activeJobs.reduce((count, job) => {
      return count + demoCandidates.filter((candidate) => matchCandidateToJob(candidate, job).score >= 80).length;
    }, 0);
    const applicationEstimate = activeJobs.reduce((count, job) => {
      return count + demoCandidates.filter((candidate) => matchCandidateToJob(candidate, job).score >= 60).length;
    }, 0);

    return [
      { label: "Active Jobs", value: activeJobs.length, note: "Live roles", gradient: "from-blue-500/12 via-blue-500/5 to-transparent" },
      { label: "Top Matches", value: topMatches, note: "Above 80% fit", gradient: "from-emerald-500/14 via-emerald-500/5 to-transparent" },
      { label: "Applications", value: applicationEstimate, note: "Qualified pool", gradient: "from-cyan-500/12 via-cyan-500/5 to-transparent" },
      { label: "Hired", value: hiredJobs.length, note: "Closed roles", gradient: "from-violet-500/12 via-violet-500/5 to-transparent" }
    ];
  }, [jobs]);

  useEffect(() => {
    const syncPanelFromHash = (event?: Event) => {
      const customEvent = event as CustomEvent<"profile" | "account">;
      if (customEvent?.detail === "profile" || customEvent?.detail === "account") {
        setActivePanel(customEvent.detail);
        return;
      }

      const hash = window.location.hash;
      if (hash === "#profile") {
        setActivePanel("profile");
        return;
      }

      if (hash === "#account-settings") {
        setActivePanel("account");
        return;
      }

      setActivePanel("home");
    };

    syncPanelFromHash();
    window.addEventListener("hashchange", syncPanelFromHash);
    window.addEventListener("popstate", syncPanelFromHash);
    window.addEventListener(EMPLOYER_PANEL_EVENT, syncPanelFromHash);

    return () => {
      window.removeEventListener("hashchange", syncPanelFromHash);
      window.removeEventListener("popstate", syncPanelFromHash);
      window.removeEventListener(EMPLOYER_PANEL_EVENT, syncPanelFromHash);
    };
  }, []);

  if (activePanel === "profile") {
    return (
      <PageContainer>
        <EmployerProfile />
      </PageContainer>
    );
  }

  if (activePanel === "account") {
    return (
      <PageContainer>
        <AccountSettings profileStorageKey="mx_employer_profile" title="Employer Account" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <DailyBrief role="employer" />
      <div className="mb-6 mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">Recruiter Dashboard</Badge>
          <h2 className="type-h2 mt-3">Hiring workspace</h2>
          <p className="type-body mt-2 max-w-2xl">Monitor active roles, candidate momentum, plan usage, and the recruiting pipeline.</p>
        </div>
        <details className="group relative self-start md:self-end">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-control border border-border bg-surface px-5 text-sm font-semibold text-text-main shadow-soft hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-900 dark:text-white">
            Workspace actions
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="z-20 mt-2 grid min-w-[230px] gap-2 rounded-card border border-border bg-surface p-2 shadow-elevated dark:border-white/10 dark:bg-slate-900 md:absolute md:right-0">
            <Link href="/employer/talent-crm" className="focus-ring flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-bold text-text-main hover:bg-primary/5 hover:text-primary dark:text-white"><UsersRound className="h-4 w-4" />Talent CRM</Link>
            <Link href="/subscriptions" className="focus-ring flex min-h-11 items-center rounded-control px-3 text-sm font-bold text-text-main hover:bg-primary/5 hover:text-primary dark:text-white">View Plans</Link>
            <Link href="/dashboard/employer/jobs/import" className="focus-ring flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-bold text-text-main hover:bg-primary/5 hover:text-primary dark:text-white"><Sparkles className="h-4 w-4" />Import Job</Link>
            <EmployerPostJob />
          </div>
        </details>
      </div>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} kind="metric" variant="interactive" className={`depth-overlay overflow-hidden bg-gradient-to-br ${item.gradient}`}>
            <div className="depth-content">
              <p className="type-label">{item.label}</p>
              <strong className="mt-3 block text-3xl font-bold text-text-main dark:text-white">{item.value}</strong>
              <p className="type-body mt-2 text-xs">{item.note}</p>
            </div>
          </Card>
        ))}
      </StaggerContainer>
      <section className="mt-6">
        <EmployerSubscriptionWidget />
      </section>
      <section className="mt-6">
        <RecommendedActions />
      </section>
      <div id="matches" className="mt-6"><RecruiterMatches /></div>
      <section id="pipeline" className="mt-6">
        <Card className="depth-primary">
          <div className="mb-6">
            <Badge variant="primary" className="type-label text-primary">ATS Pipeline</Badge>
            <h2 className="type-h2 mt-3">Hiring progress</h2>
          </div>
          <PipelineBoard />
        </Card>
      </section>
    </PageContainer>
  );
}
