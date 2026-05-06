"use client";

import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import type { JobRecommendation } from "@/types/application";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function JobRecommendations({ jobs }: { jobs: JobRecommendation[] }) {
  return (
    <Card className="p-6">
      <Badge variant="primary">AI job recommendations</Badge><h2 className="mt-2 text-2xl font-black dark:text-white">Best-fit roles</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-3xl border border-border bg-bg p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-black text-text-main dark:text-white">{job.title}</h3><p className="mt-1 text-sm font-semibold text-text-muted dark:text-slate-300">{job.company}</p></div><Badge variant={job.matchScore > 80 ? "match-score" : "primary"}>{job.matchScore}% match</Badge></div>
            <p className="mt-3 flex items-center gap-2 text-sm text-text-muted dark:text-slate-300"><MapPin className="h-4 w-4" /> {job.location} · {job.workType} · {job.salaryRange}</p>
            <p className="mt-4 rounded-2xl bg-primary/5 p-3 text-sm font-semibold text-text-muted dark:bg-white/5 dark:text-slate-300"><Sparkles className="mr-2 inline h-4 w-4 text-primary" /> {job.why}</p>
            <div className="mt-4 flex flex-wrap gap-2">{job.matchedSkills.map((skill) => <Badge key={skill} variant="success">{skill}</Badge>)}{job.missingSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            <Button className="mt-5 w-full gap-2">View job <ArrowRight className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
