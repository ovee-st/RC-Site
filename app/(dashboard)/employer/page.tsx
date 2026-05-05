"use client";

import { useEffect } from "react";
import RecruiterMatches from "@/components/dashboard/RecruiterMatches";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import PipelineBoard from "@/components/pipeline/PipelineBoard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PageContainer from "@/components/layout/PageContainer";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";

export default function EmployerDashboard() {
  const { setJobs } = useJobStore();
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

  return (
    <PageContainer>
      <div className="mb-6">
        <Badge variant="primary" className="type-label text-primary">Recruiter Dashboard</Badge>
        <h1 className="type-h1 mt-3">Hiring command center</h1>
      </div>

      <section>
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
    </PageContainer>
  );
}