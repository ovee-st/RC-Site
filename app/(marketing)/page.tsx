"use client";

import { motion } from "framer-motion";
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
    <main className="overflow-hidden bg-bg text-text-main dark:bg-slate-950 dark:text-white">
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.20),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(34,197,94,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.72))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(37,99,235,0.28),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(34,197,94,0.14),transparent_30%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.96))]" />
        <Container className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: "easeOut" }}>
            <Badge variant="primary" className="type-label text-primary">AI Hiring Platform for Bangladesh</Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.06em] text-text-main dark:text-white sm:text-5xl lg:text-7xl">
              Every hiring tool <span className="text-primary">you need</span> in one command center.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted dark:text-slate-300 sm:text-lg">
              Go from scattered applications to ranked shortlists, live pipelines, support workflows, and managed hiring help without jumping across five tools.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/login" className="rounded-2xl px-6 py-3 text-sm font-black shadow-glow">
                Start hiring <ArrowRight className="ml-2 h-4 w-4" />
              </LinkButton>
              <LinkButton href="/jobs" variant="secondary" className="rounded-2xl px-6 py-3 text-sm font-black">
                Browse jobs
              </LinkButton>
            </div>
            <p className="mt-4 text-sm font-semibold text-text-muted dark:text-slate-400">
              Built for recruiters, employers, candidates, and managed hiring teams.
            </p>
            <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
              {outcomes.map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + index * 0.08, duration: 0.45 }}>
                  <Card className="rounded-2xl p-4 shadow-soft dark:bg-white/5">
                    <p className="text-2xl font-black text-text-main dark:text-white">{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-text-muted dark:text-slate-300">{item.title}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div className="relative" initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.65, ease: "easeOut" }}>
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/25 via-blue-400/10 to-success/25 blur-3xl" />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
              <Card className="overflow-hidden rounded-[2.2rem] border-white/70 bg-white/90 p-0 shadow-glow backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
                <div className="grid gap-0 lg:grid-cols-[0.8fr_1fr]">
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-primary p-5 text-white">
                    <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-blue-300/20 blur-2xl" />
                    <div className="flex items-center justify-between">
                      <Badge variant="neutral" className="border-white/30 bg-white/10 text-white dark:bg-white/10">Live cockpit</Badge>
                      <motion.div animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                        <Sparkles className="h-6 w-6 text-blue-100" />
                      </motion.div>
                    </div>
                    <h2 className="mt-5 text-2xl font-black tracking-tight text-white">Recruiter view</h2>
                    <p className="mt-2 text-sm leading-6 text-white/80">Top candidates, active jobs, applications, ATS progress, and support signals in one animated workspace.</p>
                    <div className="mt-5 grid grid-cols-2 gap-2">
                      {[
                        ["12", "top matches"],
                        ["8", "applications"],
                        ["3", "active jobs"],
                        ["94%", "best fit"]
                      ].map(([value, label], index) => (
                        <motion.div key={label} className="rounded-2xl border border-white/10 bg-white/12 p-3 backdrop-blur" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
                          <p className="text-2xl font-black text-white">{value}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/75">{label}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="relative space-y-3 p-4">
                    <div className="absolute right-6 top-6 h-24 w-24 rounded-full border border-primary/15" />
                    {[
                      { name: "Md Jahid Anwar", roleName: "Admin & Operations", score: 94, skills: ["Admin", "Excel", "Coordination"], badge: "Top match" },
                      { name: "Nusrat Jahan", roleName: "Customer Support", score: 88, skills: ["CRM", "Communication"], badge: "Ready" },
                      { name: "Rahim Ahmed", roleName: "Frontend Developer", score: 82, skills: ["React", "TypeScript"], badge: "Good fit" }
                    ].map((candidate, index) => (
                      <motion.div key={candidate.name} className="group rounded-2xl border border-border bg-white/80 p-3 transition hover:-translate-y-1 hover:border-primary hover:shadow-soft dark:border-white/10 dark:bg-white/5" initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08, duration: 0.45 }}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-success text-xs font-black text-white shadow-soft">
                              {candidate.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black text-text-main dark:text-white">{candidate.name}</h3>
                              <p className="truncate text-[11px] font-semibold text-text-muted dark:text-slate-300">{candidate.roleName}</p>
                            </div>
                          </div>
                          <Badge variant="match-score" className="shrink-0">{candidate.score}%</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {candidate.skills.map((skill) => <Badge key={skill} variant="success" className="text-[10px]">{skill}</Badge>)}
                          <Badge variant="primary" className="text-[10px]">{candidate.badge}</Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { title: "Do-it-yourself hiring", text: "Post roles, rank candidates, view match reasoning, and move applicants through your ATS pipeline.", cta: "Start posting", href: "/login", icon: KanbanSquare },
              { title: "We Hire for You", text: "Send us the requirement. MXVL sources, screens, and delivers interview-ready candidates for your business.", cta: "Request hiring", href: "/we-hire-for-you", icon: Users }
            ].map((mode, index) => (
              <motion.div key={mode.title} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08 }}>
                <Card variant="interactive" className="relative overflow-hidden rounded-3xl p-5">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <mode.icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-2xl font-black tracking-tight text-text-main dark:text-white">{mode.title}</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted dark:text-slate-300">{mode.text}</p>
                  <LinkButton href={mode.href} variant="ghost" className="mt-4 px-0 text-primary hover:bg-transparent">
                    {mode.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </LinkButton>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="mb-6 text-center">
            <Badge variant="primary">Why MXVL</Badge>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-text-main dark:text-white">Hiring should not take five tabs, seven tools, and a spreadsheet.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Brain, title: "Manual screening becomes AI-ranked", text: "Your team sees the best-fit candidates first, with skills and missing gaps clearly explained." },
              { icon: MessageSquareText, title: "Support stays connected", text: "Live chat, tickets, and internal support operations sit beside the hiring workflow." },
              { icon: ShieldCheck, title: "Profiles stay structured", text: "Candidate CVs, skills, education, experience, and verification signals stay reusable everywhere." }
            ].map((pain, index) => (
              <motion.div key={pain.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <Card variant="interactive" className="h-full rounded-3xl p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-success/15 text-primary">
                    <pain.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-black text-text-main dark:text-white">{pain.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">{pain.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <Card className="rounded-3xl p-5">
            <Badge variant="primary">How it works</Badge>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-text-main dark:text-white">From role requirement to shortlist in one flow.</h2>
            <p className="mt-3 text-sm leading-6 text-text-muted dark:text-slate-300">Structured posting, AI ranking, recruiter review, and ATS movement stay connected from start to finish.</p>
            <LinkButton href="/we-hire-for-you" variant="secondary" className="mt-5 w-full rounded-2xl">Need managed hiring?</LinkButton>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }}>
                <Card variant="interactive" className="rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-xs font-black text-white">{index + 1}</span>
                    <div>
                      <h3 className="text-sm font-black text-text-main dark:text-white">{step.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-text-muted dark:text-slate-300">{step.text}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
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
            {categories.map((item, index) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <Card variant="interactive" className="group overflow-hidden rounded-3xl p-0">
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary via-blue-500 to-success p-4 text-white">
                    <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-xl" />
                    <item.icon className="relative h-9 w-9" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-black text-text-main dark:text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-text-muted dark:text-slate-300">{item.text}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <Card className="grid gap-5 rounded-3xl p-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <Badge variant="success">Explainable AI</Badge>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-text-main dark:text-white">Transparent match scoring, not black-box magic.</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted dark:text-slate-300">Recruiters can see why a candidate ranks high before they invite, shortlist, or interview.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Skills match", value: 40, color: "bg-success" },
                { label: "Experience match", value: 30, color: "bg-success" },
                { label: "Semantic similarity", value: 18, color: "bg-yellow-400" },
                { label: "Industry match", value: 10, color: "bg-primary" }
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
