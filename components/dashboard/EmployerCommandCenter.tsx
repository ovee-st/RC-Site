"use client";

import RecruiterMatches from "@/components/dashboard/RecruiterMatches";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import EmployerProfile from "@/components/dashboard/EmployerProfile";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import AccountSettings from "@/components/account/AccountSettings";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { useEffect, useMemo, useState } from "react";
import { useJobStore } from "@/store/useJobStore";
import { demoCandidates } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";

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
      <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">Recruiter Dashboard</Badge>
          <h1 className="type-h1 mt-3">Hiring command center</h1>
        </div>
        <EmployerPostJob />
      </div>
      <StaggerContainer className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} variant="interactive" className={`depth-overlay min-h-32 overflow-hidden bg-gradient-to-br ${item.gradient}`}>
            <div className="depth-content">
              <p className="type-label">{item.label}</p>
              <strong className="mt-3 block text-3xl font-bold text-text-main dark:text-white">{item.value}</strong>
              <p className="type-body mt-2 text-xs">{item.note}</p>
            </div>
          </Card>
        ))}
      </StaggerContainer>
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
