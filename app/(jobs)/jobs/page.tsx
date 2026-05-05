"use client";

import FiltersPanel from "@/components/filters/FiltersPanel";
import EmployerPostJob from "@/components/dashboard/EmployerPostJob";
import JobList from "@/components/jobs/JobList";
import JobPreview from "@/components/jobs/JobPreview";
import { useJobStore } from "@/store/useJobStore";
import { useAuth } from "@/hooks/useAuth";
import Card from "@/components/ui/Card";

export default function JobsPage() {
  const { selectedJob } = useJobStore();
  const { user, role } = useAuth();
  const showPostJob = Boolean(user) && role === "employer";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-transparent">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[300px_minmax(0,0.95fr)_minmax(360px,1.15fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <FiltersPanel />
        </aside>

        <section className="min-w-0 lg:order-3">
          <JobList headerAction={showPostJob ? <EmployerPostJob label="Post a Job" /> : null} />
        </section>

        <section className="min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-24">
            {selectedJob ? (
              <JobPreview />
            ) : (
              <Card className="p-6 shadow-soft">
                <p className="type-label text-primary">Job Details</p>
                <h2 className="type-h2 mt-3">Select a job to preview details</h2>
                <p className="type-body mt-2">Click any job from the list to open its full description, requirements, skills, deadline, and application action here.</p>
              </Card>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}