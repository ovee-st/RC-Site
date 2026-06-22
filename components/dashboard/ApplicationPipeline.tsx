"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
  XCircle
} from "lucide-react";
import type { CandidateApplication, ApplicationStage } from "@/types/application";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Button, LinkButton } from "@/components/ui/Button";
import { demoJobs } from "@/lib/demoData";

const stages: ApplicationStage[] = ["Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Rejected"];
type Filter = "All" | ApplicationStage;
type Sort = "newest" | "oldest" | "highest-match" | "lowest-match" | "status" | "company";

const statusConfig: Record<ApplicationStage, { label: string; nextAction: string; icon: typeof Clock3; color: string }> = {
  Applied: { label: "Applied", nextAction: "Application Submitted", icon: CheckCircle2, color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300" },
  "Under Review": { label: "Under Review", nextAction: "Waiting for Recruiter Review", icon: Clock3, color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300" },
  Shortlisted: { label: "Shortlisted", nextAction: "Expect Recruiter Contact", icon: Star, color: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300" },
  Interview: { label: "Interview Scheduled", nextAction: "Prepare for Interview", icon: CalendarDays, color: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300" },
  Offer: { label: "Offer Received", nextAction: "Review Offer", icon: Trophy, color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" },
  Rejected: { label: "Rejected", nextAction: "Continue Applying", icon: XCircle, color: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300" }
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
}

function StatusBadge({ status }: { status: ApplicationStage }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${config.color}`}><Icon className="h-3.5 w-3.5" />{config.label}</span>;
}

function MatchScore({ score }: { score: number }) {
  const color = score >= 85 ? "text-success" : score >= 70 ? "text-amber-600 dark:text-amber-300" : "text-text-muted";
  return <span className={`text-sm font-black ${color}`}>{score}%</span>;
}

function PrimaryApplicationAction({ application, onDetails }: { application: CandidateApplication; onDetails: () => void }) {
  if (application.status === "Interview") return <LinkButton href={`/candidate/interview-prep?job=${encodeURIComponent(application.jobId)}`} className="w-full whitespace-nowrap px-3 py-2 text-xs sm:w-auto"><Sparkles className="h-3.5 w-3.5" />Start Preparation</LinkButton>;
  if (application.status === "Offer") return <Button type="button" onClick={onDetails} className="w-full whitespace-nowrap px-3 py-2 text-xs sm:w-auto"><Trophy className="h-3.5 w-3.5" />View Offer</Button>;
  if (application.status === "Rejected") return <LinkButton href="/jobs" variant="secondary" className="w-full whitespace-nowrap px-3 py-2 text-xs sm:w-auto">Browse Similar Jobs</LinkButton>;
  if (application.recruiterNotes && application.status === "Shortlisted") return <Button type="button" variant="secondary" onClick={onDetails} className="w-full whitespace-nowrap px-3 py-2 text-xs sm:w-auto"><MessageSquare className="h-3.5 w-3.5" />View Feedback</Button>;
  return <Button type="button" variant="secondary" onClick={onDetails} className="w-full whitespace-nowrap px-3 py-2 text-xs sm:w-auto"><FileText className="h-3.5 w-3.5" />View Application</Button>;
}

function ApplicationDrawer({ application, onClose }: { application: CandidateApplication; onClose: () => void }) {
  const currentIndex = stages.indexOf(application.status);
  const readiness = application.interviewReadinessScore;
  const timelineStages: ApplicationStage[] = application.status === "Rejected" ? ["Applied", "Rejected"] : stages.filter((stage) => stage !== "Rejected");
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-sm" onMouseDown={onClose}>
      <aside className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-border bg-surface shadow-elevated dark:border-white/10 dark:bg-slate-950" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-surface/95 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
          <div><Badge variant="primary">Application Details</Badge><h2 className="type-h2 mt-2">{application.role}</h2><p className="type-body mt-1">{application.company}</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary" aria-label="Close application details"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-6 px-5 py-6 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="type-label">Location</p><p className="mt-1 text-sm font-bold">{application.location}</p></div>
            <div><p className="type-label">Applied Date</p><p className="mt-1 text-sm font-bold">{formatDate(application.createdAt)}</p></div>
            <div><p className="type-label">Current Status</p><div className="mt-2"><StatusBadge status={application.status} /></div></div>
            <div><p className="type-label">Match Score</p><p className="mt-1 text-2xl font-black text-primary">{application.matchScore}%</p></div>
          </div>

          <section><h3 className="type-h3">Recruiter Notes</h3><p className="type-body mt-3 rounded-md bg-bg px-4 py-3 dark:bg-white/5">{application.recruiterNotes || "No recruiter notes have been shared yet."}</p></section>

          {application.status === "Interview" ? <section className="border-l-4 border-l-violet-500 bg-violet-500/5 p-4"><h3 className="type-h3">Interview Information</h3><p className="type-body mt-2">{application.interviewInformation || "Interview scheduling details will appear here when the recruiter confirms them."}</p><p className="mt-3 text-sm font-black text-violet-700 dark:text-violet-300">Interview readiness: {readiness == null ? "Not calculated" : `${readiness}%`}</p><div className="mt-4 flex flex-wrap gap-2"><LinkButton href={`/candidate/interview-prep?job=${encodeURIComponent(application.jobId)}`}><Sparkles className="h-4 w-4" />Prepare Interview</LinkButton><LinkButton href={`/candidate/interview-prep?job=${encodeURIComponent(application.jobId)}`} variant="secondary"><Target className="h-4 w-4" />Launch Mock Interview</LinkButton></div></section> : null}
          {application.status === "Offer" ? <section className="border-l-4 border-l-success bg-success/5 p-4"><h3 className="type-h3">Offer Information</h3><p className="type-body mt-2">{application.offerInformation || "Your offer details will be shared by the employer or recruiter."}</p></section> : null}

          <section><h3 className="type-h3">Application Timeline</h3><div className="mt-4 space-y-0">{timelineStages.map((stage, index) => { const complete = application.status === "Rejected" || index <= currentIndex; const current = stage === application.status; const Icon = statusConfig[stage].icon; return <div key={stage} className="flex gap-3"><div className="flex flex-col items-center"><div className={`grid h-8 w-8 place-items-center rounded-full border ${complete ? "border-primary bg-primary text-white" : "border-border bg-bg text-text-muted dark:border-white/10 dark:bg-white/5"}`}><Icon className="h-4 w-4" /></div>{index < timelineStages.length - 1 ? <div className={`h-10 w-0.5 ${complete && !current ? "bg-primary" : "bg-border dark:bg-white/10"}`} /> : null}</div><div className="pt-1"><p className={`text-sm font-black ${current ? "text-primary" : "text-text-main dark:text-white"}`}>{statusConfig[stage].label}</p>{current ? <p className="mt-1 text-xs font-semibold text-text-muted">Current stage</p> : null}</div></div>; })}</div></section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-5 dark:border-white/10"><LinkButton href={`/jobs?job=${encodeURIComponent(application.jobId)}`} variant="secondary"><Eye className="h-4 w-4" />View Job</LinkButton>{application.status === "Interview" ? <LinkButton href={`/candidate/interview-prep?job=${encodeURIComponent(application.jobId)}`}><Sparkles className="h-4 w-4" />Prepare Interview</LinkButton> : null}{application.status === "Rejected" ? <LinkButton href="/jobs">Browse Similar Jobs</LinkButton> : null}</div>
        </div>
      </aside>
    </div>
  );
}

export default function ApplicationPipeline({ applications: initialApplications }: { applications: CandidateApplication[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectedApplication, setSelectedApplication] = useState<CandidateApplication | null>(null);

  useEffect(() => setApplications(initialApplications), [initialApplications]);

  const counts = useMemo(() => Object.fromEntries(stages.map((stage) => [stage, applications.filter((application) => application.status === stage).length])) as Record<ApplicationStage, number>, [applications]);
  const visibleApplications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = applications.filter((application) => (filter === "All" || application.status === filter) && (!needle || [application.role, application.company, application.location].some((value) => value.toLowerCase().includes(needle))));
    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "highest-match") return b.matchScore - a.matchScore;
      if (sort === "lowest-match") return a.matchScore - b.matchScore;
      if (sort === "status") return stages.indexOf(a.status) - stages.indexOf(b.status);
      if (sort === "company") return a.company.localeCompare(b.company);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [applications, filter, query, sort]);

  const recommendations = useMemo(() => {
    const appliedIds = new Set(applications.map((application) => application.jobId));
    const unapplied = demoJobs.filter((job) => !appliedIds.has(job.id));
    return (unapplied.length ? unapplied : demoJobs).slice(0, 3);
  }, [applications]);

  if (!applications.length) return <section><div><Badge variant="primary">Application Tracker</Badge><h2 className="type-h2 mt-2">Application Tracker</h2><p className="type-body mt-2">Track your job applications, monitor progress, and stay prepared for the next step in your hiring journey.</p></div><EmptyState className="mt-5" icon={<BriefcaseBusiness className="h-6 w-6" />} title="No Applications Yet" message="Explore opportunities and start tracking your applications." actionLabel="Browse Jobs" actionHref="/jobs" /></section>;

  return (
    <section>
      <div><Badge variant="primary">Application Tracker</Badge><h2 className="type-h2 mt-2">Application Tracker</h2><p className="type-body mt-2">Track your job applications, monitor progress, and stay prepared for the next step in your hiring journey.</p></div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{stages.map((stage) => { const config = statusConfig[stage]; const Icon = config.icon; return <button key={stage} type="button" onClick={() => setFilter(stage)} className={`min-h-[104px] border-l-4 bg-surface p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-hover dark:bg-slate-900 ${filter === stage ? "border-l-primary ring-2 ring-primary/15" : "border-l-border"}`}><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-black text-text-main dark:text-white">{counts[stage]}</p><p className="mt-1 text-xs font-bold text-text-muted">{config.label}</p></button>; })}</div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search job title, company, or location" className="pl-11" /></div>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row"><Select value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className="sm:w-48"><option value="All">All Applications</option>{stages.map((stage) => <option key={stage} value={stage}>{statusConfig[stage].label}</option>)}</Select><Select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="sm:w-48"><option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="highest-match">Highest Match</option><option value="lowest-match">Lowest Match</option><option value="status">Status</option><option value="company">Company Name</option></Select></div>
      </div>

      <div className="mt-4 hidden overflow-hidden border border-border bg-surface shadow-soft dark:border-white/10 dark:bg-slate-900 xl:block"><table className="w-full table-fixed border-collapse text-left"><colgroup><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[10%]" /><col className="w-[10%]" /><col className="w-[7%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[15%]" /></colgroup><thead className="bg-bg text-xs font-black uppercase text-text-muted dark:bg-white/5"><tr>{["Job Title", "Company", "Location", "Applied Date", "Match", "Current Status", "Next Action", "Actions"].map((label) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody>{visibleApplications.map((application) => <tr key={application.id} onClick={() => setSelectedApplication(application)} className="cursor-pointer border-t border-border align-top transition hover:bg-primary/5 dark:border-white/10"><td className="whitespace-normal break-words px-3 py-4 text-sm font-black text-text-main dark:text-white">{application.role}</td><td className="break-words px-3 py-4 text-sm font-semibold">{application.company}</td><td className="break-words px-3 py-4 text-sm text-text-muted">{application.location}</td><td className="px-3 py-4 text-sm text-text-muted">{formatDate(application.createdAt)}</td><td className="px-3 py-4"><MatchScore score={application.matchScore} /></td><td className="px-3 py-4"><StatusBadge status={application.status} /></td><td className="px-3 py-4 text-sm font-bold text-text-muted">{statusConfig[application.status].nextAction}</td><td className="px-3 py-4" onClick={(event) => event.stopPropagation()}><div className="flex flex-col items-start gap-2"><LinkButton href={`/jobs?job=${encodeURIComponent(application.jobId)}`} variant="ghost" className="px-2.5 py-2" title="View Job"><Eye className="h-4 w-4" /></LinkButton><PrimaryApplicationAction application={application} onDetails={() => setSelectedApplication(application)} /></div></td></tr>)}</tbody></table></div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:hidden">{visibleApplications.map((application) => <Card key={application.id} className="p-5" onClick={() => setSelectedApplication(application)}><div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-black text-text-main dark:text-white">{application.role}</h3><p className="mt-1 text-sm font-semibold text-text-muted">{application.company}</p></div><MatchScore score={application.matchScore} /></div><div className="mt-3"><StatusBadge status={application.status} /></div><div className="mt-4 flex items-start gap-2 text-sm font-bold text-text-muted"><Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{statusConfig[application.status].nextAction}</div><div className="mt-4" onClick={(event) => event.stopPropagation()}><PrimaryApplicationAction application={application} onDetails={() => setSelectedApplication(application)} /></div></Card>)}</div>
      {!visibleApplications.length ? <EmptyState className="mt-4" title="No matching applications" message="Try another search term or status filter." actionLabel="Clear Filters" onAction={() => { setQuery(""); setFilter("All"); }} /> : null}

      <div className="mt-8 border-t border-border pt-6 dark:border-white/10"><div className="flex items-end justify-between gap-4"><div><Badge>Recommended Jobs</Badge><h2 className="type-h2 mt-2">Recommended Jobs For You</h2><p className="type-body mt-1">Based on your skills, applied roles, and career interests.</p></div><LinkButton href="/jobs" variant="secondary">View All Jobs</LinkButton></div><div className="mt-4 grid gap-3 md:grid-cols-3">{recommendations.map((job) => <Card key={job.id} className="p-5"><h3 className="text-base font-black text-text-main dark:text-white">{job.title}</h3><p className="mt-1 text-sm font-semibold text-text-muted">{job.company}</p><p className="mt-3 flex items-center gap-2 text-xs font-bold text-text-muted"><MapPin className="h-3.5 w-3.5" />{job.location}</p><div className="mt-3 flex flex-wrap gap-2">{job.skills.slice(0, 3).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div><LinkButton href={`/jobs?job=${encodeURIComponent(job.id)}`} className="mt-4 w-full">View Job</LinkButton></Card>)}</div></div>

      {selectedApplication ? <ApplicationDrawer application={selectedApplication} onClose={() => setSelectedApplication(null)} /> : null}
    </section>
  );
}
