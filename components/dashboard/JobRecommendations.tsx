"use client";

import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { JobRecommendation } from "@/types/application";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function JobRecommendations({ jobs }: { jobs: JobRecommendation[] }) {
  return (
    <Card className="h-[430px] overflow-hidden p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Badge variant="primary">AI job recommendations</Badge>
          <h2 className="mt-1 text-lg font-black dark:text-white">Best-fit roles</h2>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-4 grid max-h-[350px] gap-3 overflow-y-auto pr-1">
        {jobs.map((job) => (
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
            <div className="mt-2 flex flex-wrap gap-1.5">{job.matchedSkills.map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}{job.missingSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            <Button className="mt-3 w-full gap-2 px-3 py-2 text-xs">View job <ArrowRight className="h-3.5 w-3.5" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
