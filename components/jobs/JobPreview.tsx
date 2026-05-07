"use client";

import { useEffect, useState } from "react";
import { useJobStore } from "@/store/useJobStore";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { Bookmark, CalendarDays, Check, MousePointerClick, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { demoCandidates } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";

export default function JobPreview() {
  const { selectedJob, setSelectedJob } = useJobStore();
  const { role } = useAuth();
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [employerBranding, setEmployerBranding] = useState<{ bannerUrl: string | null; photoUrl: string | null }>({
    bannerUrl: null,
    photoUrl: null
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mx_employer_profile");
      const profile = saved ? JSON.parse(saved) : null;
      setEmployerBranding({
        bannerUrl: profile?.banner_url || null,
        photoUrl: profile?.photo_url || null
      });
    } catch {
      setEmployerBranding({ bannerUrl: null, photoUrl: null });
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (isTyping || event.metaKey || event.ctrlKey || event.altKey || !selectedJob) return;

      if (event.key.toLowerCase() === "s") {
        setSavedJobs((current) => ({ ...current, [selectedJob.id]: !current[selectedJob.id] }));
      }

      if (event.key.toLowerCase() === "a") {
        setAppliedJobs((current) => ({ ...current, [selectedJob.id]: true }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedJob]);

  if (!selectedJob) {
    return (
      <EmptyState
        className="sticky top-20"
        icon={<MousePointerClick size={22} />}
        title="Select a job to view details"
        message="Choose a role from the list to see company details, requirements, salary range, and the application deadline."
      />
    );
  }

  const bannerUrl = selectedJob.bannerUrl || employerBranding.bannerUrl;
  const employerPhotoUrl = selectedJob.employerPhotoUrl || employerBranding.photoUrl;
  const highPriority = selectedJob.status === "active";
  const needsReview = selectedJob.status === "archived";
  const saved = Boolean(savedJobs[selectedJob.id]);
  const applied = Boolean(appliedJobs[selectedJob.id]);
  const postedDate = selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently posted";
  const deadline = selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not specified";
  const match = matchCandidateToJob(demoCandidates[0], selectedJob);

  return (
    <aside className="sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto">
      <Card className="depth-primary overflow-hidden rounded-2xl p-0">
        <div className="relative min-h-[174px] overflow-hidden border-b border-border bg-gradient-to-br from-slate-900 via-slate-900 to-primary/80 p-7 dark:border-white/10">
          {bannerUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt={`${selectedJob.company} banner`} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/62 to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.45),transparent_52%)]" />
          )}
          <button
            type="button"
            onClick={() => setSelectedJob(null)}
            className="absolute right-5 top-5 z-10 hidden h-10 w-10 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white xl:flex"
            aria-label="Close job details"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10 flex items-center gap-3 pr-12">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/95 text-xs font-black text-primary shadow-soft ring-1 ring-white/30">
              {employerPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employerPhotoUrl} alt={`${selectedJob.company} profile`} className="h-full w-full object-cover" />
              ) : (
                selectedJob.company.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-black text-white drop-shadow-sm">{selectedJob.company}</p>
              <p className="text-xs font-semibold text-white/78 drop-shadow-sm">Posted {postedDate}</p>
            </div>
          </div>

          <h1 className="relative z-10 mt-6 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">{selectedJob.title}</h1>
          <p className="relative z-10 mt-3 text-base font-semibold text-white/82 drop-shadow-sm">{selectedJob.location}</p>
          <div className="relative z-10 mt-4 flex flex-wrap gap-3">
            <Badge>{selectedJob.experience}</Badge>
            <Badge>{selectedJob.jobType}</Badge>
            {selectedJob.workType ? <Badge>{selectedJob.workType}</Badge> : null}
            {selectedJob.hideSalary ? <Badge>Salary hidden</Badge> : <Badge>BDT {selectedJob.salaryMin / 1000}k-{selectedJob.salaryMax / 1000}k</Badge>}
          </div>
          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <Badge variant="primary">{selectedJob.category}</Badge>
            {highPriority ? <PriorityIndicator variant="top" pulse /> : null}
            {needsReview ? <PriorityIndicator variant="review" pulse /> : null}
          </div>
        </div>

        <div className="p-6">
          {role === "employer" ? null : (
            <section className="mb-6">
              <h2 className="text-2xl font-black tracking-tight text-text-main dark:text-white">How your profile and resume fit this job</h2>
              <div className="mt-4 rounded-2xl border border-border bg-bg p-5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="type-label">AI Match Score</span>
                    <p className="mt-1 text-sm font-semibold text-text-muted dark:text-slate-300">
                      Skills {match.breakdown.skills}% · Experience {match.breakdown.experience}% · Semantic {match.breakdown.semantic}%
                    </p>
                  </div>
                  <Badge variant={match.score >= 80 ? "match-score" : "primary"} className="text-sm">{match.score}% match</Badge>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-border dark:bg-white/10">
                  <div className="h-full rounded-full bg-success" style={{ width: `${match.score}%` }} />
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {["Show match details", "Tailor my resume", "Help me stand out"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-bold text-text-main transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    {label}
                  </button>
                ))}
              </div>
            </section>
          )}

          <Card className="bg-bg shadow-none dark:bg-white/5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="type-label">Post Date</span>
                <p className="mt-1 text-lg font-black text-text-main dark:text-white">{postedDate}</p>
              </div>
              <div>
                <span className="type-label">Application Deadline</span>
                <p className="mt-1 text-lg font-black text-text-main dark:text-white">{deadline}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
          </Card>

          <div className="mt-6 grid gap-6">
            <section>
              <h3 className="type-h3 font-bold">Description</h3>
              <p className="type-body mt-3">{selectedJob.description}</p>
            </section>
            <section>
              <h3 className="type-h3 font-bold">Requirements</h3>
              <p className="type-body mt-3">{selectedJob.requirements}</p>
            </section>
            <section>
              <h3 className="type-h3 font-bold">Skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedJob.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
              </div>
            </section>
          </div>
        </div>

        {role === "employer" ? null : (
        <div className="sticky bottom-0 border-t border-border bg-surface/92 p-6 backdrop-blur dark:border-white/10 dark:bg-slate-900/92">
          <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
            <Button
              variant={saved ? "success" : "secondary"}
              className="gap-2 py-3"
              onClick={() => setSavedJobs((current) => ({ ...current, [selectedJob.id]: !current[selectedJob.id] }))}
            >
              {saved ? <Check size={16} /> : <Bookmark size={16} />}
              {saved ? "Saved" : "Save"}
              <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] dark:border-white/10 sm:inline">S</span>
            </Button>
            <Button
              variant={applied ? "success" : "primary"}
              className="gap-2 py-3"
              onClick={() => setAppliedJobs((current) => ({ ...current, [selectedJob.id]: true }))}
            >
              {applied ? <Check size={16} /> : <Send size={16} />}
              {applied ? "Applied" : "Apply Now"}
              <span className="hidden rounded-md border border-white/30 px-1.5 py-0.5 text-[10px] sm:inline">A</span>
            </Button>
          </div>
        </div>
        )}
      </Card>
    </aside>
  );
}
