"use client";

import { useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import JobItem from "./JobItem";
import { useJobStore } from "@/store/useJobStore";
import { demoCandidates } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import EmptyState from "@/components/ui/EmptyState";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

export default function JobList({ headerAction }: { headerAction?: ReactNode }) {
  const { jobs, filters, selectedJob, setSelectedJob, clearFilters, setJobs } = useJobStore();
  const { role, user } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadJobs() {
      let query = supabase.from("jobs").select("*");
      if (role === "employer" && user?.id) query = query.eq("employer_id", user.id);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data?.length) setJobs(data.map(mapSupabaseJob));
    }

    loadJobs().catch(() => null);
  }, [role, user?.id, setJobs]);
  const rankedJobs = useMemo(() => jobs
    .filter((job) => {
      const effectiveStatus = isExpired(job.deadline) ? "archived" : (job.status || "active");
      const visibleStatus = role === "employer" || effectiveStatus === "active";
      const search = filters.search.toLowerCase();
      const matchesSearch = !search || `${job.title} ${job.company} ${job.skills.join(" ")}`.toLowerCase().includes(search);
      const matchesCategory = !filters.categories.length || filters.categories.includes(job.category);
      const matchesExperience = !filters.experience.length || filters.experience.includes(job.experience) || (filters.experience.includes("Fresher") && job.experience === "Entry Level");
      const matchesType = !filters.jobType.length || filters.jobType.includes(job.jobType) || Boolean(job.workType && filters.jobType.includes(job.workType));
      const matchesLocation = !filters.locations.length || filters.locations.some((location) => job.location.toLowerCase().includes(location.toLowerCase()));
      const matchesSalary = job.hideSalary || job.salaryMax <= filters.salary;
      const matchesSkills = !filters.skills.length || filters.skills.every((skill) => job.skills.includes(skill));
      return visibleStatus && matchesSearch && matchesCategory && matchesExperience && matchesType && matchesLocation && matchesSalary && matchesSkills;
    })
    .map((job) => ({
      ...job,
      matchScore: matchCandidateToJob(demoCandidates[0], job).score
    }))
    .sort((a, b) => b.matchScore - a.matchScore),
  [jobs, filters, role]);

  const openCount = jobs.filter((job) => (job.status || "active") === "active" && !isExpired(job.deadline)).length;

  useEffect(() => {
    if (selectedJob && !rankedJobs.some((job) => job.id === selectedJob.id)) {
      setSelectedJob(null);
    }
  }, [rankedJobs, selectedJob, setSelectedJob]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="type-label text-primary">Open roles</p>
          <h2 className="type-h2 mt-1">{openCount} open jobs</h2>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <StaggerContainer className="space-y-3">
        {rankedJobs.map((job) => <JobItem key={job.id} job={job} matchScore={job.matchScore} />)}
        {!rankedJobs.length ? (
          <EmptyState
            icon={<SlidersHorizontal size={22} />}
            title="No jobs found"
            message="Try removing filters, expanding your salary range, or searching with a broader skill keyword."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : null}
      </StaggerContainer>
    </section>
  );
}
