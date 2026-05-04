"use client";

import { useEffect, useState } from "react";
import { useJobStore } from "@/store/useJobStore";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import PriorityIndicator from "@/components/ui/PriorityIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { Bookmark, CalendarDays, Check, MousePointerClick, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function JobPreview() {
  const { selectedJob } = useJobStore();
  const { role } = useAuth();
  const [savedJobs, setSavedJobs] = useState<Record<string, boolean>>({});
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [employerBanner, setEmployerBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("mx_employer_profile");
      setEmployerBanner(saved ? JSON.parse(saved).banner_url || null : null);
    } catch {
      setEmployerBanner(null);
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

  const bannerUrl = selectedJob.bannerUrl || employerBanner;
  const highPriority = selectedJob.status === "active";
  const needsReview = selectedJob.status === "archived";
  const saved = Boolean(savedJobs[selectedJob.id]);
  const applied = Boolean(appliedJobs[selectedJob.id]);
  const postedDate = selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently posted";
  const deadline = selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not specified";

  return (
    <aside className="sticky top-20 h-fit">
      <Card className="depth-primary overflow-hidden rounded-lg p-0">
        {bannerUrl ? (
          <div className="aspect-[4/1] overflow-hidden border-b border-border dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt={`${selectedJob.company} banner`} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="border-b border-border bg-gradient-to-br from-primary/14 via-primary/5 to-transparent p-6 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{selectedJob.category}</Badge>
            {highPriority ? <PriorityIndicator variant="top" pulse /> : null}
            {needsReview ? <PriorityIndicator variant="review" pulse /> : null}
          </div>
          <h1 className="type-h1 mt-3 leading-tight">{selectedJob.title}</h1>
          <p className="type-body mt-2">{selectedJob.company} - {selectedJob.location}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Badge>{selectedJob.experience}</Badge>
            <Badge>{selectedJob.jobType}</Badge>
            {selectedJob.workType ? <Badge>{selectedJob.workType}</Badge> : null}
            {selectedJob.hideSalary ? <Badge>Salary hidden</Badge> : <Badge>BDT {selectedJob.salaryMin / 1000}k-{selectedJob.salaryMax / 1000}k</Badge>}
          </div>
        </div>

        <div className="p-6">
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
