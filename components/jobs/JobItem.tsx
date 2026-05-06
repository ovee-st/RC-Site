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
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

function salaryLabel(job: Job) {
  if (job.hideSalary) return "Salary hidden";
  return `BDT ${job.salaryMin / 1000}k-${job.salaryMax / 1000}k`;
}

function postTimeLabel(createdAt?: string) {
  if (!createdAt) return "Recently posted";
  const createdDate = new Date(createdAt);
  if (!Number.isFinite(createdDate.getTime())) return "Recently posted";

  const diffMs = Date.now() - createdDate.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1 day ago";
  if (diffDays < 7) return `Posted ${diffDays} days ago`;

  const weeks = Math.floor(diffDays / 7);
  if (weeks < 5) return `Posted ${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(diffDays / 30);
  return `Posted ${months} ${months === 1 ? "month" : "months"} ago`;
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
  const compactListMode = Boolean(selectedJob);
  const highMatch = matchScore >= 85;
  const staleJob = matchScore < 45;
  const isEmployer = role === "employer";
  const isCandidate = role === "candidate";
  const archived = job.status === "archived" || isExpired(job.deadline);
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

  const setJobStatus = async (status: Job["status"]) => {
    updateJob(job.id, { status });

    if (!isSupabaseConfigured || !isEmployer) return;

    try {
      await supabase
        .from("jobs")
        .update({ status })
        .eq("id", job.id)
        .throwOnError();
    } catch {
      // Keep the UI responsive; the next Supabase refresh will reconcile any failed update.
    }
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
        variant="default"
        className={cn(
          "group rounded-none border-0 border-l-4 border-l-transparent bg-transparent text-left shadow-none outline-none transition hover:-translate-y-0 hover:bg-primary/5 hover:shadow-none focus:ring-4 focus:ring-primary/10 dark:hover:bg-slate-800/60",
          compactListMode ? "p-3" : "p-4",
          highMatch && !isEmployer && "hover:bg-success/5",
          active && "border-l-primary bg-primary/8 ring-0 dark:bg-primary/12",
          archived && "opacity-70",
          hired && "bg-success/5 dark:bg-success/10"
        )}
      >
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className={cn("flex min-w-0 items-start", compactListMode ? "gap-3" : "gap-4")}>
            <div className={cn(
              "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-success/15 font-black text-primary ring-1 ring-primary/15 transition group-hover:scale-105 dark:from-primary/25 dark:to-success/20",
              compactListMode ? "h-11 w-11 text-xs" : "h-14 w-14 text-sm"
            )}>
              {job.company.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-2">
                <h3 className={cn(
                  "min-w-0 text-primary transition group-hover:text-primary-hover dark:text-blue-300 dark:group-hover:text-blue-200",
                  compactListMode ? "truncate text-sm font-black leading-5" : "line-clamp-2 text-base font-black leading-6"
                )}>
                  {job.title}
                </h3>
                {!compactListMode && archived ? <Badge variant="neutral">Archived</Badge> : null}
                {!compactListMode && hired ? <Badge variant="success">Hired</Badge> : null}
                {!compactListMode && !isEmployer && highMatch ? <PriorityIndicator variant="top" pulse /> : null}
                {!compactListMode && !isEmployer && staleJob ? <PriorityIndicator variant="stale" /> : null}
              </div>

              <p className="mt-1 truncate text-sm font-medium text-text-main dark:text-slate-100">{job.company}</p>
              <p className="mt-0.5 truncate text-sm text-text-muted dark:text-slate-300">{job.location}</p>

              <div className={cn(
                "mt-2 flex items-center gap-x-2 gap-y-1 text-xs font-semibold text-text-muted dark:text-slate-300",
                compactListMode ? "truncate whitespace-nowrap" : "flex-wrap"
              )}>
                <span>{job.experience}</span>
                {job.experienceYears && !compactListMode ? <><span>·</span><span>{job.experienceYears} yrs exp</span></> : null}
                <span>·</span>
                <span>{job.jobType}</span>
                {job.workType ? <><span>·</span><span>{job.workType}</span></> : null}
                {!compactListMode ? <><span>·</span><span>{salaryLabel(job)}</span></> : null}
              </div>

              <div className={cn("mt-2 flex flex-wrap gap-2", compactListMode && "hidden sm:flex")}>
                {job.skills.slice(0, compactListMode ? 2 : 4).map((skill) => (
                  <span key={skill} className="rounded-full border border-border bg-bg px-2.5 py-1 text-[11px] font-bold text-text-muted dark:border-slate-600/70 dark:bg-slate-800/90 dark:text-slate-100">
                    {skill}
                  </span>
                ))}
              </div>

              {!isEmployer ? (
                <p className={cn("mt-2 text-xs font-semibold text-text-muted dark:text-slate-400", compactListMode && "truncate")}>
                  Viewed · {isCandidate ? "AI ranked" : postTimeLabel(job.createdAt)} · Easy Apply
                </p>
              ) : null}
            </div>
          </div>

          <div className={cn(
            "flex shrink-0 items-start justify-end gap-2",
            compactListMode ? "min-w-[72px]" : "flex-wrap md:min-w-[112px] md:flex-col md:items-end"
          )}>
            {isEmployer ? (
              <>
                <Badge variant={hired ? "success" : archived ? "neutral" : "primary"} className={cn(compactListMode && "px-2 py-0.5 text-[11px]")}>{hired ? "Hired" : archived ? "Archived" : "Active"}</Badge>
                <div className={cn("flex flex-wrap justify-end gap-2", compactListMode && "hidden")}>
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
                      setJobStatus(archived ? "active" : "archived");
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
                      setJobStatus("hired");
                    }}
                  >
                    <Trophy size={14} />
                    Hired
                  </Button>
                </div>
              </>
            ) : isCandidate ? (
              <>
                <Badge
                  variant={highMatch ? "match-score" : staleJob ? "neutral" : "primary"}
                  className={cn("whitespace-nowrap", compactListMode && "px-2 py-0.5 text-[11px]", highMatch && "animate-pulse bg-success/10 text-success shadow-[0_0_26px_rgba(34,197,94,0.18)]")}
                >
                  {matchScore}% match
                </Badge>
                <div className={cn("flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100", compactListMode && "hidden")}>
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
            ) : (
              <Badge variant="neutral" className={cn("whitespace-nowrap", compactListMode && "px-2 py-0.5 text-[11px]")}>
                {postTimeLabel(job.createdAt)}
              </Badge>
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
