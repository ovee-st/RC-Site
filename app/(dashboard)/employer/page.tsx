"use client";

import { useEffect } from "react";
import RecruiterMatches from "@/components/dashboard/RecruiterMatches";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import EmployerProfile from "@/components/dashboard/EmployerProfile";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const date = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(date.getTime()) && date < new Date();
}

export default function EmployerDashboard() {
  const { jobs, setJobs } = useJobStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return;

    supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setJobs(data.map(mapSupabaseJob));
      });
  }, [user?.id, setJobs]);

  const activeJobs = jobs.filter((job) => (job.status || "active") === "active" && !isExpired(job.deadline));
  const archivedJobs = jobs.filter((job) => job.status === "archived" || isExpired(job.deadline));
  const hiredJobs = jobs.filter((job) => job.status === "hired");

  const stats = [
    { label: "Active Jobs", value: activeJobs.length, note: "Live roles", gradient: "from-blue-500/12 via-blue-500/5 to-transparent" },
    { label: "Archived Jobs", value: archivedJobs.length, note: "Closed or expired", gradient: "from-slate-500/14 via-slate-500/5 to-transparent" },
    { label: "Applications", value: 8, note: "This week", gradient: "from-cyan-500/12 via-cyan-500/5 to-transparent" },
    { label: "Hired", value: hiredJobs.length, note: "Closed roles", gradient: "from-violet-500/12 via-violet-500/5 to-transparent" }
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <Badge variant="primary" className="type-label text-primary">Recruiter Dashboard</Badge>
          <h1 className="type-h1 mt-3">Hiring command center</h1>
          <p className="type-body mt-2 max-w-2xl">AI analytics, candidate recommendations, and pipeline movement based on your active posted jobs.</p>
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

      <div id="matches" className="mt-6">
        <RecruiterMatches />
      </div>

      <section id="pipeline" className="mt-6">
        <Card className="depth-primary">
          <div className="mb-6">
            <Badge variant="primary" className="type-label text-primary">ATS Pipeline</Badge>
            <h2 className="type-h2 mt-3">Hiring progress</h2>
          </div>
          <PipelineBoard />
        </Card>
      </section>

      <section className="mt-6">
        <EmployerProfile />
      </section>
    </PageContainer>
  );
}