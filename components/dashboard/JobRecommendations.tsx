"use client";

import { ArrowRight, ChevronDown, MapPin, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { Candidate } from "@/types";
import type { CandidateProfile } from "@/types/candidate";
import type { JobRecommendation } from "@/types/application";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { cn } from "@/lib/cn";

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

function salaryLabel(salaryMin: number, salaryMax: number) {
  return `BDT ${salaryMin / 1000}k-${salaryMax / 1000}k`;
}

function profileToCandidate(profile?: CandidateProfile): Candidate {
  if (!profile) return demoCandidates[0];

  return {
    id: profile.id,
    name: profile.name,
    title: profile.title,
    avatar: profile.avatarUrl,
    category: profile.title.includes("HR") || profile.title.includes("Admin") ? "HR & Admin" : demoCandidates[0].category,
    experience: profile.experienceLevel,
    skills: profile.skills,
    profile: profile.bio
  };
}

function buildJobRecommendations(candidate: Candidate, fallbackJobs: JobRecommendation[]) {
  const matchedJobs = demoJobs
    .filter((job) => (job.status || "active") === "active" && !isExpired(job.deadline))
    .map((job) => {
      const match = matchCandidateToJob(candidate, job);
      const matchedSkills = match.matchedSkills.length
        ? match.matchedSkills
        : job.skills.filter((skill) => candidate.skills.map((item) => item.toLowerCase()).includes(skill.toLowerCase()));
      const why = matchedSkills.length
        ? `Your profile matches ${matchedSkills.length}/${job.skills.length} required skills for this role.`
        : `This job is open, but improving ${match.missingSkills.slice(0, 2).join(" and ") || "role-specific skills"} can raise your match.`;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        workType: job.workType || job.jobType,
        matchScore: match.score,
        salaryRange: job.hideSalary ? "Salary hidden" : salaryLabel(job.salaryMin, job.salaryMax),
        matchedSkills,
        missingSkills: match.missingSkills,
        why
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return matchedJobs.length ? matchedJobs : fallbackJobs;
}

export default function JobRecommendations({ jobs, candidateProfile }: { jobs: JobRecommendation[]; candidateProfile?: CandidateProfile }) {
  const [expanded, setExpanded] = useState(false);
  const recommendations = useMemo(
    () => buildJobRecommendations(profileToCandidate(candidateProfile), jobs),
    [candidateProfile, jobs]
  );
  const visibleJobs = expanded ? recommendations : recommendations.slice(0, 2);

  return (
    <Card className={cn("overflow-hidden p-4 transition-all", expanded ? "h-auto" : "h-[430px]")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge variant="primary">AI job recommendations</Badge>
          <h2 className="mt-1 text-lg font-black dark:text-white">Best-fit roles</h2>
          <p className="mt-1 text-xs font-semibold text-text-muted dark:text-slate-300">
            {recommendations.length} matched open {recommendations.length === 1 ? "job" : "jobs"} based on your skills and profile.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="gap-1 px-3 py-2 text-xs"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Collapse" : "Show all"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition", expanded && "rotate-180")} />
        </Button>
      </div>
      <div className={cn("mt-4 grid gap-3 overflow-y-auto pr-1", expanded ? "max-h-[720px]" : "max-h-[320px]")}>
        {visibleJobs.map((job) => (
          <div key={job.id} className="rounded-2xl border border-border bg-bg p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black text-text-main dark:text-white">{job.title}</h3>
                <p className="mt-0.5 truncate text-xs font-semibold text-text-muted dark:text-slate-300">{job.company}</p>
              </div>
              <Badge variant={job.matchScore > 80 ? "match-score" : "primary"}>{job.matchScore}%</Badge>
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-text-muted dark:text-slate-300"><MapPin className="h-3.5 w-3.5" /> {job.location} · {job.workType} · {job.salaryRange}</p>
            <p className="mt-2 line-clamp-2 rounded-xl bg-primary/5 p-2 text-xs font-semibold text-text-muted dark:bg-white/5 dark:text-slate-300"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" /> {job.why}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {job.matchedSkills.map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}
              {job.missingSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
            </div>
            <LinkButton href="/jobs" className="mt-3 w-full gap-2 px-3 py-2 text-xs">View job <ArrowRight className="h-3.5 w-3.5" /></LinkButton>
          </div>
        ))}
      </div>
    </Card>
  );
}

