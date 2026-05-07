"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import FiltersPanel from "@/components/filters/FiltersPanel";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import JobList from "@/components/jobs/JobList";
import JobPreview from "@/components/jobs/JobPreview";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import { Archive, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function JobsPage() {
  const searchParams = useSearchParams();
  const { jobs, selectedJob, setSelectedJob } = useJobStore();
  const { user, role } = useAuth();
  const showPostJob = Boolean(user) && role === "employer";
  const [showArchivedJobs, setShowArchivedJobs] = useState(false);
  const closeSelectedJob = () => {
    if (typeof window !== "undefined" && window.location.search.includes("job=")) {
      window.history.replaceState(null, "", "/jobs");
    }
    setSelectedJob(null);
  };
  const employerHeaderAction = showPostJob ? (
    <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 sm:items-center sm:justify-end sm:gap-3">
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

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) return;

    const job = jobs.find((item) => item.id === jobId);
    if (job) setSelectedJob(job);
  }, [jobs, searchParams, setSelectedJob]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-transparent">
      {selectedJob ? (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 px-3 py-4 sm:px-6 sm:py-8 xl:grid-cols-[minmax(390px,0.82fr)_minmax(0,1.18fr)]">
          <section className="min-w-0 xl:border-r xl:border-border xl:dark:border-white/10">
            <JobList headerAction={employerHeaderAction} showArchived={showArchivedJobs} />
          </section>

          <section className="hidden min-w-0 xl:block">
            <JobPreview />
          </section>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-4 px-3 py-4 sm:px-6 sm:py-8 lg:gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
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
            onClick={closeSelectedJob}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-bg p-3 shadow-elevated dark:bg-slate-950 sm:left-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-none sm:max-w-2xl sm:rounded-none sm:p-6">
            <button
              type="button"
              onClick={closeSelectedJob}
              className="sticky top-0 z-10 ml-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-soft transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-slate-900"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
            <JobPreview mode="modal" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
