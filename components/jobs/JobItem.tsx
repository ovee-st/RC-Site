"use client";

import { useEffect, useState } from "react";
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
import { normalizeDateValue, normalizeJobStatus } from "@/lib/jobUpdate";
import { bdjobsDepartments } from "@/lib/bdjobsDepartments";
import { employmentTypeOptions, workLocationOptions } from "@/lib/jobOptions";
import SkillPicker from "@/components/skills/SkillPicker";
import { normalizeProfileImageUrl } from "@/lib/profileImageSync";

type JobEditDraft = {
  company: string;
  title: string;
  location: string;
  category: string;
  experience: string;
  experienceYears: string;
  jobType: string;
  workType: string;
  salaryMin: string;
  salaryMax: string;
  hideSalary: boolean;
  deadline: string;
  status: NonNullable<Job["status"]>;
  skills: string[];
  description: string;
  requirements: string;
};

function buildEditDraft(job: Job): JobEditDraft {
  return {
    company: job.company,
    title: job.title,
    location: job.location,
    category: job.category,
    experience: job.experience,
    experienceYears: job.experienceYears || "",
    jobType: job.jobType,
    workType: job.workType || "On-site",
    salaryMin: String(job.salaryMin),
    salaryMax: String(job.salaryMax),
    hideSalary: Boolean(job.hideSalary),
    deadline: job.deadline || "",
    status: normalizeJobStatus(job.status),
    skills: job.skills,
    description: job.description,
    requirements: job.requirements
  };
}

function EditTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...textAreaProps } = props;
  return <textarea {...textAreaProps} className={cn("focus-ring min-h-32 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main placeholder:text-text-muted shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white", className)} />;
}

function isExpired(deadline?: string) {
  if (!deadline) return false;
  const deadlineDate = new Date(`${deadline}T23:59:59`);
  return Number.isFinite(deadlineDate.getTime()) && deadlineDate < new Date();
}

async function persistJobUpdate(jobId: string, patch: Record<string, any>) {
  if (!isSupabaseConfigured) return;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;

  const response = await fetch(`/api/jobs/${jobId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(patch)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Could not update job.");
  }
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
  const { user, role } = useAuth();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [localEmployerPhoto, setLocalEmployerPhoto] = useState<string | null>(null);
  const [draft, setDraft] = useState<JobEditDraft>(() => buildEditDraft(job));
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  const active = selectedJob?.id === job.id;
  const compactListMode = Boolean(selectedJob);
  const highMatch = matchScore >= 85;
  const staleJob = matchScore < 45;
  const isEmployer = role === "employer" || role === "admin";
  const isCandidate = role === "candidate";
  const archived = normalizeJobStatus(job.status) === "archived" || isExpired(job.deadline);
  const hired = job.status === "hired";
  const employerPhotoUrl = job.employerPhotoUrl || localEmployerPhoto;
  const handleApply = () => {
    if (!user || role !== "candidate") {
      window.location.href = `/login?next=${encodeURIComponent(`/jobs?job=${job.id}`)}`;
      return;
    }

    setSelectedJob(job);
    setApplied(true);
  };

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mx_employer_profile");
      const profile = saved ? JSON.parse(saved) : null;
      setLocalEmployerPhoto(normalizeProfileImageUrl(profile?.photo_url));
    } catch {
      setLocalEmployerPhoto(null);
    }
  }, []);

  const saveEdit = async () => {
    setEditMessage("");
    if (!draft.company.trim() || !draft.title.trim() || !draft.location.trim() || !draft.description.trim()) {
      setEditMessage("Company, title, location, and description are required.");
      return;
    }

    const updates: Partial<Job> = {
      company: draft.company.trim(),
      title: draft.title.trim(),
      location: draft.location.trim(),
      category: draft.category,
      experience: draft.experience,
      experienceYears: draft.experienceYears.trim(),
      jobType: draft.jobType,
      workType: draft.workType,
      salaryMin: Number(draft.salaryMin) || 0,
      salaryMax: Number(draft.salaryMax) || 0,
      hideSalary: draft.hideSalary,
      deadline: normalizeDateValue(draft.deadline),
      status: normalizeJobStatus(draft.status),
      skills: draft.skills,
      description: draft.description.trim(),
      requirements: draft.requirements.trim()
    };

    setEditSaving(true);
    try {
      await persistJobUpdate(job.id, updates);
      updateJob(job.id, updates);
      setEditing(false);
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : "Could not update job.");
    } finally {
      setEditSaving(false);
    }
  };

  const setJobStatus = async (status: Job["status"]) => {
    const normalizedStatus = normalizeJobStatus(status);
    updateJob(job.id, { status: normalizedStatus });

    try {
      await persistJobUpdate(job.id, { status: normalizedStatus });
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
          compactListMode ? "p-4 md:p-3" : "p-4",
          highMatch && isCandidate && "hover:bg-success/5",
          active && "border-l-primary bg-primary/8 ring-0 dark:bg-primary/12",
          archived && "opacity-70",
          hired && "bg-success/5 dark:bg-success/10"
        )}
      >
        <div className={cn(
          "grid min-w-0 gap-3",
          compactListMode ? "grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"
        )}>
          <div className={cn("flex min-w-0 items-start", compactListMode ? "gap-3" : "gap-4")}>
            <div className={cn(
              "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 to-success/15 font-black text-primary ring-1 ring-primary/15 transition group-hover:scale-105 dark:from-primary/25 dark:to-success/20",
              compactListMode ? "h-11 w-11 text-xs" : "h-14 w-14 text-sm"
            )}>
              {employerPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employerPhotoUrl} alt={`${job.company} profile`} className="h-full w-full object-cover" />
              ) : (
                job.company.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-start gap-2">
                <h3 className={cn(
                  "min-w-0 flex-1 text-primary transition group-hover:text-primary-hover dark:text-blue-300 dark:group-hover:text-blue-200",
                  compactListMode ? "line-clamp-2 text-base font-black leading-6 md:truncate md:text-sm md:leading-5" : "line-clamp-2 text-base font-black leading-6"
                )}>
                  {job.title}
                </h3>
                {!compactListMode && archived ? <Badge variant="neutral">Archived</Badge> : null}
                {!compactListMode && hired ? <Badge variant="success">Hired</Badge> : null}
                {!compactListMode && isCandidate && highMatch ? <PriorityIndicator variant="top" pulse /> : null}
                {!compactListMode && isCandidate && staleJob ? <PriorityIndicator variant="stale" /> : null}
              </div>

              <p className="mt-1 truncate text-sm font-medium text-text-main dark:text-slate-100">{job.company}</p>
              <p className="mt-0.5 truncate text-sm text-text-muted dark:text-slate-300">{job.location}</p>

              <div className={cn(
                "mt-2 flex items-center gap-x-2 gap-y-1 text-xs font-semibold text-text-muted dark:text-slate-300",
                compactListMode ? "flex-wrap md:flex-nowrap md:overflow-hidden" : "flex-wrap"
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
                <p className={cn("mt-2 text-xs font-semibold text-text-muted dark:text-slate-400", compactListMode && "line-clamp-2 md:truncate")}>
                  Viewed · {isCandidate ? "AI ranked" : postTimeLabel(job.createdAt)} · Easy Apply
                </p>
              ) : null}
            </div>
          </div>

          <div className={cn(
            "flex shrink-0 items-start gap-2",
            compactListMode ? "min-w-0 flex-wrap justify-start md:min-w-[72px] md:justify-end" : "flex-wrap justify-end md:min-w-[112px] md:flex-col md:items-end"
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
                      setDraft(buildEditDraft(job));
                      setEditMessage("");
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
                      handleApply();
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
          <Card className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden p-0 shadow-elevated">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-6 py-5 dark:border-white/10">
              <div>
                <Badge variant="primary" className="type-label text-primary">Edit Job</Badge>
                <h2 className="type-h2 mt-2">Update published role</h2>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} placeholder="Company name" />
                <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Designation / Job title" />
                <Input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Job location" />
                <select value={draft.jobType} onChange={(event) => setDraft((current) => ({ ...current, jobType: event.target.value }))} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  {employmentTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={draft.workType} onChange={(event) => setDraft((current) => ({ ...current, workType: event.target.value }))} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  {workLocationOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  {bdjobsDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
                </select>
                <select value={draft.experience} onChange={(event) => setDraft((current) => ({ ...current, experience: event.target.value }))} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  <option>Entry Level</option><option>Mid Level</option><option>Senior Level</option>
                </select>
                <Input value={draft.experienceYears} onChange={(event) => setDraft((current) => ({ ...current, experienceYears: event.target.value }))} placeholder="Required experience (years)" type="number" min="0" />
                <Input value={draft.salaryMin} onChange={(event) => setDraft((current) => ({ ...current, salaryMin: event.target.value }))} placeholder="Min salary" type="number" min="0" />
                <Input value={draft.salaryMax} onChange={(event) => setDraft((current) => ({ ...current, salaryMax: event.target.value }))} placeholder="Max salary" type="number" min="0" />
                <label className="flex min-h-[46px] items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  <input type="checkbox" checked={draft.hideSalary} onChange={(event) => setDraft((current) => ({ ...current, hideSalary: event.target.checked }))} className="h-4 w-4 accent-primary" />
                  Hide salary from public job post
                </label>
                <Input value={draft.deadline} onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value }))} placeholder="Application deadline" type="date" />
                <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: normalizeJobStatus(event.target.value) }))} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                  <option value="active">Active</option><option value="archived">Archived</option><option value="hired">Hired</option>
                </select>
                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3"><p className="type-label">Required Skills</p><p className="text-xs font-semibold text-text-muted">{draft.skills.length} selected</p></div>
                  <SkillPicker compact selectedSkills={draft.skills} onChange={(skills) => setDraft((current) => ({ ...current, skills }))} />
                </div>
                <EditTextArea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Job description" className="md:col-span-2" />
                <EditTextArea value={draft.requirements} onChange={(event) => setDraft((current) => ({ ...current, requirements: event.target.value }))} placeholder="Requirements" className="md:col-span-2" />
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-surface/95 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
              {editMessage ? <p className="text-sm font-semibold text-danger">{editMessage}</p> : <span />}
              <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="button" onClick={saveEdit} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
