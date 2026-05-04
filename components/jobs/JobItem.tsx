"use client";

import { useState } from "react";
import { Archive, Bookmark, Check, Pencil, Send, Trophy, X } from "lucide-react";
import type { Job } from "@/types";
import { useJobStore } from "@/store/useJobStore";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";

function salaryLabel(job: Job) {
  if (job.hideSalary) return "Salary hidden";
  return `BDT ${job.salaryMin / 1000}k-${job.salaryMax / 1000}k`;
}

export default function JobItem({ job, matchScore }: { job: Job; matchScore: number }) {
  const { selectedJob, setSelectedJob, updateJob } = useJobStore();
  const { role } = useAuth();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: job.title,
    location: job.location,
    salaryMin: String(job.salaryMin),
    salaryMax: String(job.salaryMax),
    deadline: job.deadline || ""
  });

  const active = selectedJob?.id === job.id;
  const highMatch = matchScore >= 85;
  const staleJob = matchScore < 45;
  const isEmployer = role === "employer";
  const archived = job.status === "archived";
  const hired = job.status === "hired";

  const saveEdit = () => {
    updateJob(job.id, {
      title: draft.title,
      location: draft.location,
      salaryMin: Number(draft.salaryMin) || job.salaryMin,
      salaryMax: Number(draft.salaryMax) || job.salaryMax,
      deadline: draft.deadline
    });
    setEditing(false);
  };

  return (
    <>
      <Card
        onClick={() => setSelectedJob(job)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedJob(job);
          }
        }}
        role="button"
        tabIndex={0}
        variant={active ? "highlighted" : "interactive"}
        className={cn(
          "group w-full p-4 text-left outline-none hover:border-primary/40 hover:shadow-hover focus:ring-4 focus:ring-primary/10 dark:hover:bg-slate-900",
          highMatch && !isEmployer && "shadow-[0_0_32px_rgba(34,197,94,0.10)] hover:border-success/40",
          active && "border-primary bg-primary/5 ring-4 ring-primary/10 dark:bg-primary/10",
          archived && "opacity-70",
          hired && "border-success/30 bg-success/5 dark:bg-success/10"
        )}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-success/15 text-sm font-bold text-primary ring-1 ring-primary/15 transition group-hover:scale-105">
              {job.company.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="type-h3 truncate font-bold">{job.title}</h3>
                {archived ? <Badge variant="neutral">Archived</Badge> : null}
                {hired ? <Badge variant="success">Hired</Badge> : null}
                {!isEmployer && highMatch ? <PriorityIndicator variant="top" pulse /> : null}
                {!isEmployer && staleJob ? <PriorityIndicator variant="stale" /> : null}
              </div>
              <p className="type-body mt-1 truncate">{job.company} - {job.location}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted dark:text-slate-300">
                <span>{job.experience}</span>
                {job.experienceYears ? <span>{job.experienceYears} yrs exp</span> : null}
                <span>{job.jobType}</span>
                {job.workType ? <span>{job.workType}</span> : null}
                <span>{salaryLabel(job)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="rounded-full border border-border bg-bg px-3 py-1 text-xs font-bold text-text-muted dark:border-slate-600/70 dark:bg-slate-800/90 dark:text-slate-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 md:flex-col md:items-end">
            {isEmployer ? (
              <>
                <Badge variant={hired ? "success" : archived ? "neutral" : "primary"}>{hired ? "Hired" : archived ? "Archived" : "Active"}</Badge>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1.5 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDraft({
                        title: job.title,
                        location: job.location,
                        salaryMin: String(job.salaryMin),
                        salaryMax: String(job.salaryMax),
                        deadline: job.deadline || ""
                      });
                      setEditing(true);
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-1.5 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateJob(job.id, { status: archived ? "active" : "archived" });
                    }}
                  >
                    <Archive size={14} />
                    {archived ? "Unarchive" : "Archive"}
                  </Button>
                  <Button
                    type="button"
                    variant="success"
                    className="gap-1.5 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateJob(job.id, { status: "hired" });
                    }}
                  >
                    <Trophy size={14} />
                    Hired
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Badge
                  variant={highMatch ? "match-score" : staleJob ? "neutral" : "primary"}
                  className={cn(highMatch && "animate-pulse bg-success/10 text-success shadow-[0_0_26px_rgba(34,197,94,0.18)]")}
                >
                  {matchScore}% match
                </Badge>
                <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                  <Button
                    type="button"
                    variant={saved ? "success" : "secondary"}
                    className="gap-1.5 px-3 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSaved((value) => !value);
                    }}
                  >
                    {saved ? <Check size={14} /> : <Bookmark size={14} />}
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant={applied ? "success" : "primary"}
                    className="gap-1.5 px-4 py-2"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedJob(job);
                      setApplied(true);
                    }}
                  >
                    {applied ? <Check size={14} /> : <Send size={14} />}
                    {applied ? "Applied" : "Apply"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-slate-950/20 p-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close edit job" onClick={() => setEditing(false)} />
          <Card className="relative w-full max-w-xl p-6 shadow-elevated">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <Badge variant="primary" className="type-label text-primary">Edit Job</Badge>
                <h2 className="type-h2 mt-2">Update published role</h2>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Job title" />
              <Input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={draft.salaryMin} onChange={(event) => setDraft((current) => ({ ...current, salaryMin: event.target.value }))} placeholder="Min salary" type="number" />
                <Input value={draft.salaryMax} onChange={(event) => setDraft((current) => ({ ...current, salaryMax: event.target.value }))} placeholder="Max salary" type="number" />
              </div>
              <Input value={draft.deadline} onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value }))} placeholder="Application deadline" type="date" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="button" onClick={saveEdit}>Save Changes</Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
