"use client";

import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  Building2,
  KanbanSquare,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import StatsCards from "@/components/dashboard/StatsCards";
import AIInsights from "@/components/dashboard/AIInsights";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import AssessmentSection from "@/components/dashboard/AssessmentSection";
import InterviewSection from "@/components/dashboard/InterviewSection";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import ResumeSection from "@/components/dashboard/ResumeSection";
import EmployerCommandCenter from "@/components/dashboard/EmployerCommandCenter";
import AdminPanel from "@/components/admin/AdminPanel";
import type { CandidateAnalytics, CandidateDocument, CandidateNotification, CandidateProfile, InterviewEvent, SkillAssessment } from "@/types/candidate";
import type { CandidateApplication, JobRecommendation } from "@/types/application";

const steps = [
  { title: "Post the role", text: "Add category, skills, salary, deadline, and workplace preferences in a structured hiring form." },
  { title: "AI ranks talent", text: "Profiles are matched by structured data and semantic similarity so strong fits surface first." },
  { title: "Review top matches", text: "Recruiters see the top 5-10 candidates with explainable score breakdowns and missing skills." },
  { title: "Move to hire", text: "Invite, shortlist, interview, and close roles from the ATS pipeline with fewer manual handoffs." }
];

const categories = [
  { title: "White Collar", text: "Admin, HR, finance, customer support, IT, operations, sales, and office roles.", icon: Building2 },
  { title: "Blue Collar", text: "Drivers, cleaners, security, production, hospitality, warehouse, and field teams.", icon: BriefcaseBusiness },
  { title: "Business Promoters", text: "Promoters, brand ambassadors, field activation, retail support, and campaign staff.", icon: Users }
];

const outcomes = [
  { label: "48h", title: "shortlist delivery", text: "Move from job post to qualified candidate review in days, not weeks." },
  { label: "90%", title: "match accuracy target", text: "Blend AI similarity with structured hiring criteria for reliable ranking." },
  { label: "10k+", title: "candidate pool", text: "Centralize candidates, skills, CVs, applications, and recruiter actions." }
];

const candidateHomeProfile: CandidateProfile = {
  id: "candidate-home",
  name: "Md Jahid Anwar",
  title: "Administrative Human Resources",
  email: "",
  phone: "+880 1700 000000",
  location: "Dhaka, Bangladesh",
  experienceLevel: "Mid Level",
  yearsExperience: 7,
  bio: "Operations and HR administration professional with experience in vendor coordination, documentation, facilities support, and structured reporting for fast-moving teams.",
  skills: ["Admin", "Excel", "Coordination", "Documentation", "Vendor Management", "HR Operations"],
  socials: {
    linkedin: "https://linkedin.com/in/md-jahid-anwar",
    github: "",
    portfolio: ""
  },
  profileCompletion: 88,
  aiMatchScore: 94,
  resumeScore: 84
};

const candidateHomeApplications: CandidateApplication[] = [
  { id: "home-app-1", candidateId: "candidate-home", jobId: "job-1", company: "MX Partner Employer", role: "Admin & Operations Manager", location: "Dhaka", status: "Shortlisted", matchScore: 94, recruiterNotes: "Strong admin operations fit. Invite for first round.", createdAt: "2026-04-28", updatedAt: "2026-05-05" },
  { id: "home-app-2", candidateId: "candidate-home", jobId: "job-2", company: "Remote Support BD", role: "Customer Support Executive", location: "Uttara", status: "Under Review", matchScore: 78, recruiterNotes: "Needs CRM proof.", createdAt: "2026-04-30", updatedAt: "2026-05-03" },
  { id: "home-app-3", candidateId: "candidate-home", jobId: "job-3", company: "Venture SaaS Lab", role: "Operations Coordinator", location: "Remote", status: "Interview", matchScore: 87, recruiterNotes: "Interview scheduled with operations lead.", createdAt: "2026-05-01", updatedAt: "2026-05-06" }
];

const candidateHomeDocuments: CandidateDocument[] = [
  { id: "home-doc-1", name: "ATS-CV.pdf", type: "Resume", url: "#", uploadedAt: "2026-05-02", score: 84 },
  { id: "home-doc-2", name: "HR-Operations-Certificate.pdf", type: "Certification", url: "#", uploadedAt: "2026-04-22", score: 91 }
];

const candidateHomeAssessments: SkillAssessment[] = [
  { id: "home-assess-1", title: "Admin Operations MCQ", category: "Operations", score: 88, level: "Advanced", status: "Completed", summary: "Strong documentation, coordination, and workflow control." },
  { id: "home-assess-2", title: "Excel Reporting Challenge", category: "Data", score: 82, level: "Upper Intermediate", status: "Completed", summary: "Good spreadsheet structure and reporting discipline." },
  { id: "home-assess-3", title: "Communication Scenario Test", category: "Communication", score: 76, level: "Recommended", status: "Recommended", summary: "Recommended to improve recruiter-facing communication signals." }
];

const candidateHomeInterviews: InterviewEvent[] = [
  { id: "home-int-1", company: "MX Partner Employer", role: "Admin & Operations Manager", scheduledAt: "2026-05-09T11:00:00+06:00", meetingUrl: "https://meet.google.com/demo", checklist: ["Review job responsibilities", "Prepare vendor coordination example", "Bring latest ATS CV"], feedback: "Strong operations fit." }
];

const candidateHomeNotifications: CandidateNotification[] = [
  { id: "home-n-1", type: "interview", title: "Interview scheduled", message: "MX Partner Employer scheduled an interview for Admin & Operations Manager.", createdAt: "2026-05-06T09:10:00+06:00", isRead: false },
  { id: "home-n-2", type: "ai", title: "Resume suggestion", message: "Add quantified outcomes to your latest operations role to improve ATS strength.", createdAt: "2026-05-05T18:20:00+06:00", isRead: false },
  { id: "home-n-3", type: "application", title: "Application shortlisted", message: "Your profile moved to Shortlisted for Admin & Operations Manager.", createdAt: "2026-05-04T13:00:00+06:00", isRead: true }
];

const candidateHomeAnalytics: CandidateAnalytics = {
  applicationSuccessRate: 64,
  interviewsCompleted: 5,
  recruiterResponseRate: 78,
  profileViews: 143,
  skillTrends: [
    { skill: "Admin", value: 92 },
    { skill: "Excel", value: 86 },
    { skill: "Coordination", value: 89 },
    { skill: "Communication", value: 74 }
  ]
};

const candidateHomeJobs: JobRecommendation[] = [
  { id: "home-rec-1", title: "Admin & Operations Manager", company: "MX Partner Employer", location: "Dhaka", workType: "On-site", matchScore: 94, salaryRange: "BDT 30k-50k", matchedSkills: ["Admin", "Excel", "Coordination"], missingSkills: ["ERP"], why: "Your operations and documentation background strongly matches this role." },
  { id: "home-rec-2", title: "HR & Admin Executive", company: "Growth Textile Ltd", location: "Savar", workType: "Hybrid", matchScore: 86, salaryRange: "BDT 25k-40k", matchedSkills: ["HR Operations", "Documentation"], missingSkills: ["Payroll"], why: "Strong HR administration overlap with manageable missing payroll exposure." }
];

function CandidateHomeDashboard({ profile }: { profile: CandidateProfile }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-bg py-6 dark:bg-slate-950">
      <Container>
        <div className="mb-4 border-b border-border pb-4 dark:border-white/10">
          <Badge variant="primary" className="type-label text-primary">Candidate Portal</Badge>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">Your Career Command Center</h1>
          <p className="type-body mt-2 max-w-xl">Manage your profile, discover matched jobs, track applications, and generate professional CVs.</p>
        </div>

        <div className="min-w-0 space-y-4">
          <StatsCards profile={profile} applications={candidateHomeApplications} />

          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="overflow-hidden p-0 shadow-soft">
              <div className="bg-gradient-to-br from-primary via-blue-500 to-success p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Candidate Home</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">Your AI hiring command center is ready.</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-white/80">Track profile strength, applications, interviews, resume health, and AI job recommendations from one place.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {[
                    { label: "Improve profile", href: "/candidate?view=profile" },
                    { label: "Download CV", href: "/candidate?tab=resume" },
                    { label: "Review matches", href: "/candidate?tab=jobs" }
                  ].map((action) => (
                    <LinkButton key={action.label} href={action.href} variant="secondary" className="rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white backdrop-blur hover:bg-white/25">
                      {action.label}
                    </LinkButton>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="h-full p-4 shadow-soft">
              <Badge variant="primary">Recent activity</Badge>
              <div className="mt-4 max-h-52 space-y-3 overflow-y-auto pr-1">
                {[
                  "Profile viewed by MX Partner Employer",
                  "AI resume scan improved ATS score by 6%",
                  "Interview scheduled for Admin & Operations Manager",
                  "New recommended job found with 94% match"
                ].map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                    <p className="text-xs font-semibold leading-5 text-text-muted dark:text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AIInsights />
            <JobRecommendations jobs={candidateHomeJobs} candidateProfile={profile} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AssessmentSection assessments={candidateHomeAssessments} />
            <InterviewSection interviews={candidateHomeInterviews} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <NotificationsPanel notifications={candidateHomeNotifications} />
            <AnalyticsPanel analytics={candidateHomeAnalytics} />
          </div>

          <ResumeSection profile={profile} documents={candidateHomeDocuments} />
          <ApplicationPipeline applications={candidateHomeApplications} />
        </div>
      </Container>
    </main>
  );
}

export default function LandingPage() {
  const { user, role } = useAuth();
  const isAdmin = Boolean(user) && (role === "admin" || role === "viewer");
  const isEmployer = Boolean(user) && role === "employer";
  const isCandidate = Boolean(user) && role === "candidate";

  if (isAdmin) {
    return <AdminPanel section="dashboard" />;
  }

  if (isCandidate) {
    const candidateProfile = {
      ...candidateHomeProfile,
      userId: user?.id,
      name: user?.user_metadata?.name || user?.user_metadata?.full_name || user?.name || candidateHomeProfile.name,
      email: user?.email || "",
      avatarUrl: user?.avatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || candidateHomeProfile.avatarUrl
    };

    return <CandidateHomeDashboard profile={candidateProfile} />;
  }

  if (isEmployer) {
    return <EmployerCommandCenter />;
  }

  return (
    <main className="overflow-hidden bg-bg dark:bg-slate-950">
      <section className="relative py-14 sm:py-16 lg:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(37,99,235,0.22),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.8),rgba(248,250,252,0))] dark:bg-[radial-gradient(circle_at_16%_12%,rgba(37,99,235,0.28),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(34,197,94,0.14),transparent_28%)]" />
        <Container className="grid items-center gap-7 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <Badge variant="primary" className="type-label text-primary">AI Hiring Platform for Bangladesh</Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-text-main dark:text-white sm:text-5xl lg:text-6xl">
              Hire <span className="text-primary">top talent</span> with an AI command center.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-text-muted dark:text-slate-300">
              Post jobs, rank candidates, manage pipelines, and get support-led hiring help from one compact workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/login" className="rounded-2xl px-6 py-3 text-sm font-black">
                Start hiring <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton href="/jobs" variant="secondary" className="rounded-2xl px-6 py-3 text-sm font-black">
                Browse jobs
              </LinkButton>
            </div>
            <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
              {outcomes.map((item) => (
                <Card key={item.title} className="rounded-2xl p-4 shadow-soft">
                  <p className="text-2xl font-black text-text-main dark:text-white">{item.label}</p>
                  <p className="mt-1 text-[11px] font-bold leading-4 text-text-muted dark:text-slate-300">{item.title}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-transparent to-success/20 blur-2xl" />
            <Card className="overflow-hidden rounded-[2rem] p-0 shadow-glow dark:bg-slate-900/95">
              <div className="grid gap-0 lg:grid-cols-[0.78fr_1fr]">
                <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-primary p-5 text-white">
                  <div className="flex items-center justify-between">
                    <Badge variant="neutral" className="bg-white/10 text-white dark:bg-white/10">Live cockpit</Badge>
                    <Sparkles className="h-5 w-5 text-blue-200" />
                  </div>
                  <h2 className="mt-5 text-2xl font-black tracking-tight text-white">Recruiter view</h2>
                  <p className="mt-2 text-xs leading-5 text-white/70">Top candidates, active jobs, applications, and support signals in one glance.</p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {[
                      ["12", "top matches"],
                      ["8", "applications"],
                      ["3", "active jobs"],
                      ["94%", "best fit"]
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                        <p className="text-xl font-black text-white">{value}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/75">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    { name: "Md Jahid Anwar", roleName: "Admin & Operations", score: 94, skills: ["Admin", "Excel", "Coordination"] },
                    { name: "Nusrat Jahan", roleName: "Customer Support", score: 88, skills: ["CRM", "Communication"] },
                    { name: "Rahim Ahmed", roleName: "Frontend Developer", score: 82, skills: ["React", "TypeScript"] }
                  ].map((candidate, index) => (
                    <div key={candidate.name} className="group rounded-2xl border border-border bg-bg p-3 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-soft dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-success text-xs font-black text-white">
                            {candidate.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-text-main dark:text-white">{candidate.name}</h3>
                            <p className="text-[11px] font-semibold text-text-muted dark:text-slate-300">{candidate.roleName}</p>
                          </div>
                        </div>
                        <Badge variant="match-score" className="shrink-0">{candidate.score}%</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill) => <Badge key={skill} variant="success" className="text-[10px]">{skill}</Badge>)}
                        {index === 0 ? <Badge variant="primary" className="text-[10px]">Top match</Badge> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-6">
        <Container>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { icon: Brain, title: "AI scoring", text: "Structured + semantic ranking." },
              { icon: KanbanSquare, title: "ATS pipeline", text: "Applied to hired in one board." },
              { icon: ShieldCheck, title: "Verified profiles", text: "Cleaner candidate confidence." },
              { icon: MessageSquareText, title: "Live support", text: "Support and hiring help built in." }
            ].map((item) => (
              <Card key={item.title} variant="interactive" className="flex items-center gap-3 rounded-2xl p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-text-main dark:text-white">{item.title}</h2>
                  <p className="mt-1 text-xs leading-5 text-text-muted dark:text-slate-300">{item.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <Card className="rounded-3xl p-5">
            <Badge variant="primary">How it works</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-text-main dark:text-white">From job post to hire, without the clutter.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted dark:text-slate-300">A compact operating system for posting, matching, reviewing, and closing roles faster.</p>
            <LinkButton href="/we-hire-for-you" variant="secondary" className="mt-5 w-full rounded-2xl">Need hiring support?</LinkButton>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={step.title} variant="interactive" className="rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-xs font-black text-white">{index + 1}</span>
                  <div>
                    <h3 className="text-sm font-black text-text-main dark:text-white">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-text-muted dark:text-slate-300">{step.text}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <Badge variant="primary">Role coverage</Badge>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-text-main dark:text-white">Built for high-volume hiring categories.</h2>
            </div>
            <LinkButton href="/services" variant="ghost">View services</LinkButton>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {categories.map((item) => (
              <Card key={item.title} variant="interactive" className="group overflow-hidden rounded-3xl p-0">
                <div className="relative h-24 overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-success p-4 text-white">
                  <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-xl" />
                  <item.icon className="relative h-8 w-8" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-black text-text-main dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-text-muted dark:text-slate-300">{item.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <Card className="grid gap-5 rounded-3xl p-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge variant="success">Explainable AI</Badge>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-text-main dark:text-white">Transparent match scoring, not magic.</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted dark:text-slate-300">Recruiters can see why a candidate ranks high before they invite, shortlist, or interview.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Skills", value: 40, color: "bg-success" },
                { label: "Experience", value: 30, color: "bg-success" },
                { label: "Semantic", value: 18, color: "bg-yellow-400" },
                { label: "Industry", value: 10, color: "bg-primary" }
              ].map((bar) => (
                <div key={bar.label} className="rounded-2xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="mb-2 flex justify-between text-xs font-black text-text-muted dark:text-slate-300"><span>{bar.label}</span><span>{bar.value}%</span></div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className={`${bar.color} h-2 rounded-full`} style={{ width: `${Math.min(bar.value * 2, 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <Card className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-blue-600 to-slate-950 p-7 text-white shadow-glow">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">MX Venture Lab</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Stop screening. Start hiring.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Bring job posts, AI matches, CVs, support, and hiring progress into one premium recruitment workspace.</p>
              </div>
              <LinkButton href="/login" variant="secondary" className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-primary hover:bg-white/90">Create account</LinkButton>
            </div>
          </Card>
        </Container>
      </section>
    </main>
  );
}


