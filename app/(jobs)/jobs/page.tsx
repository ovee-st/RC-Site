"use client";

import FiltersPanel from "@/components/filters/FiltersPanel";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import JobList from "@/components/jobs/JobList";
import JobPreview from "@/components/jobs/JobPreview";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import { X } from "lucide-react";

export default function JobsPage() {
  const { selectedJob, setSelectedJob } = useJobStore();
  const { user, role } = useAuth();
  const showPostJob = Boolean(user) && role === "employer";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-transparent">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-40 lg:h-fit">
          <FiltersPanel />
        </aside>
        <section className="min-w-0">
          <JobList headerAction={showPostJob ? <EmployerPostJob label="Post a Job" /> : null} />
        </section>
      </div>

      {selectedJob ? (
        <div className="fixed inset-0 z-[80] bg-slate-950/35 backdrop-blur-sm">
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
