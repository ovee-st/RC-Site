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
import Card from "@/components/ui/Card";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { Job } from "@/types";

function mapSupabaseJob(row: any): Job {
  const skills = Array.isArray(row.required_skills_array)
    ? row.required_skills_array
    : Array.isArray(row.required_skills)
      ? row.required_skills
      : String(row.required_skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  return {
    id: row.id,
    title: row.job_title || row.title || "Untitled job",
    company: row.company_name || "Company",
    location: row.job_location || row.location || "Bangladesh",
    category: row.category || "Others",
    experience: row.experience_level || row.job_level || "Any Level",
    experienceYears: row.experience_years || "",
    jobType: row.job_type || row.employment_type || "Full Time",
    workType: row.work_type || row.job_type || "On-site",
    salaryMin: Number(row.salary_min || 0),
    salaryMax: Number(row.salary_max || 0),
    hideSalary: Boolean(row.hide_salary || row.salary_hidden),
    deadline: row.last_date || row.deadline || "",
    bannerUrl: row.banner_url || null,
    employerPhotoUrl: row.employer_photo_url || row.photo_url || row.company_logo_url || null,
    status: row.status || "active",
    skills,
    description: row.description || "Job description will be shared by the employer.",
    requirements: row.requirements || "Requirements will be shared by the employer.",
    createdAt: row.created_at
  };
}

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

export default function JobList({ headerAction, showArchived = false }: { headerAction?: ReactNode; showArchived?: boolean }) {
  const { jobs, filters, selectedJob, setSelectedJob, clearFilters, setJobs } = useJobStore();
  const { role, user } = useAuth();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function loadJobs() {
      let query = supabase.from("jobs").select("*");
      if (role === "employer" && user?.id) query = query.eq("employer_id", user.id);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data?.length) return;

      const employerIds = Array.from(new Set(data.map((row: any) => row.employer_id).filter(Boolean)));
      let brandingByEmployer = new Map<string, { banner_url?: string | null; photo_url?: string | null }>();

      if (employerIds.length) {
        const { data: employerProfiles } = await supabase
          .from("employers")
          .select("user_id, banner_url, photo_url")
          .in("user_id", employerIds);

        brandingByEmployer = new Map((employerProfiles || []).map((profile: any) => [profile.user_id, profile]));
      }

      setJobs(data.map((row: any) => {
        const branding = brandingByEmployer.get(row.employer_id);
        return mapSupabaseJob({
          ...row,
          banner_url: row.banner_url || branding?.banner_url || null,
          employer_photo_url: row.employer_photo_url || branding?.photo_url || null
        });
      }));
    }

    loadJobs().catch(() => null);
  }, [role, user?.id, setJobs]);

  const rankedJobs = useMemo(() => jobs
    .filter((job) => {
      const effectiveStatus = isExpired(job.deadline) ? "archived" : (job.status || "active");
      const visibleStatus = role === "employer"
        ? showArchived
          ? effectiveStatus === "archived"
          : effectiveStatus !== "archived"
        : effectiveStatus === "active";
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
  [jobs, filters, role, showArchived]);

  const openCount = jobs.filter((job) => (job.status || "active") === "active" && !isExpired(job.deadline)).length;
  const archivedCount = jobs.filter((job) => job.status === "archived" || isExpired(job.deadline)).length;

  useEffect(() => {
    if (selectedJob && !rankedJobs.some((job) => job.id === selectedJob.id)) {
      setSelectedJob(null);
    }
  }, [rankedJobs, selectedJob, setSelectedJob]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-surface/80 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/80 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-text-main dark:text-white sm:text-2xl">
              {role === "employer" ? (showArchived ? "Archived jobs" : "Published jobs") : "Top job picks for you"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-muted dark:text-slate-300">
              {role === "employer"
                ? showArchived
                  ? "Archived and expired roles are kept here and hidden from public job listings."
                  : "Active published roles are visible on the jobs page. Archived roles stay hidden."
                : "Based on your profile, preferences, filters, and AI relevance signals."}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-muted dark:text-slate-400">
              {showArchived ? `${archivedCount} archived jobs` : `${openCount} open jobs`}
            </p>
          </div>
          {headerAction ? <div className="shrink-0 sm:self-start">{headerAction}</div> : null}
        </div>
      </div>

      <StaggerContainer className="max-h-none divide-y divide-border overflow-visible dark:divide-white/10 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
        {rankedJobs.map((job) => <JobItem key={job.id} job={job} matchScore={job.matchScore} />)}
        {!rankedJobs.length ? (
          <div className="p-5">
            <EmptyState
              icon={<SlidersHorizontal size={22} />}
              title={showArchived ? "No archived jobs found" : "No jobs found"}
              message={showArchived ? "Archived or expired roles will appear here after you archive them." : "Try removing filters, expanding your salary range, or searching with a broader skill keyword."}
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          </div>
        ) : null}
      </StaggerContainer>
    </Card>
  );
}
