"use client";

import { useState } from "react";
import FiltersPanel from "@/components/filters/FiltersPanel";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import JobList from "@/components/jobs/JobList";
import JobPreview from "@/components/jobs/JobPreview";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import { Archive, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function JobsPage() {
  const { selectedJob, setSelectedJob } = useJobStore();
  const { user, role } = useAuth();
  const showPostJob = Boolean(user) && role === "employer";
  const [showArchivedJobs, setShowArchivedJobs] = useState(false);
  const employerHeaderAction = showPostJob ? (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <EmployerPostJob label="Post a Job" />
      <Button
        type="button"
        variant={showArchivedJobs ? "primary" : "secondary"}
        onClick={() => {
          setShowArchivedJobs((current) => !current);
          setSelectedJob(null);
        }}
        className="gap-2"
      >
        <Archive className="h-4 w-4" />
        {showArchivedJobs ? "Posted Jobs" : "Archived Jobs"}
      </Button>
    </div>
  ) : null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-transparent">
      {selectedJob ? (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 px-6 py-8 xl:grid-cols-[minmax(390px,0.82fr)_minmax(0,1.18fr)]">
          <section className="min-w-0 xl:border-r xl:border-border xl:dark:border-white/10">
            <JobList headerAction={employerHeaderAction} showArchived={showArchivedJobs} />
          </section>

          <section className="hidden min-w-0 xl:block">
            <JobPreview />
          </section>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-6 py-8 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-24 xl:h-fit">
            <FiltersPanel />
          </aside>

          <section className="min-w-0">
            <JobList headerAction={employerHeaderAction} showArchived={showArchivedJobs} />
          </section>
        </div>
      )}

      {selectedJob ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-sm xl:hidden">
          <button
            type="button"
            aria-label="Close job details"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedJob(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-bg p-4 shadow-elevated dark:bg-slate-950 sm:max-w-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setSelectedJob(null)}
              className="sticky top-0 z-10 ml-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-soft transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-slate-900"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
            <JobPreview />
          </div>
        </div>
      ) : null}
    </main>
  );
}
