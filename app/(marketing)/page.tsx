"use client";

import {
  ArrowRight,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  KanbanSquare,
  Layers3,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { StaggerContainer } from "@/components/motion/MotionSystem";
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

const features = [
  { icon: Brain, title: "AI-ranked shortlists", text: "Turn every job post into a ranked list of ready candidates, scored by skills, experience, category, and semantic fit." },
  { icon: KanbanSquare, title: "Built-in hiring pipeline", text: "Shortlist, invite, interview, offer, and hire inside one workspace without losing candidate context." },
  { icon: MessageSquareText, title: "Support-led hiring service", text: "When employers need extra help, MXVL can source, screen, and deliver curated profiles for them." }
];

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

const pricing = ["Starter", "Growth", "Enterprise"];

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
      <Section className="relative pt-24 pb-14 sm:pt-28 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(37,99,235,0.18),transparent_34%),radial-gradient(circle_at_84%_20%,rgba(34,197,94,0.13),transparent_30%)]" />
        <Container className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <Badge variant="primary" className="type-label text-primary">AI Hiring Platform for Bangladesh</Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.06em] text-text-main dark:text-white sm:text-6xl lg:text-7xl">
              Hire <span className="text-primary">job-ready talent</span> before your competitors do.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted dark:text-slate-300">
              MX Venture Lab helps employers post roles, rank candidates with AI, manage interviews, and move hiring from scattered CVs to one decisive command center.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="/login" className="rounded-2xl px-7 py-4 text-base font-black">
                Start hiring smarter <ArrowRight className="ml-2 h-5 w-5" />
              </LinkButton>
              <LinkButton href="/jobs" variant="secondary" className="rounded-2xl px-7 py-4 text-base font-black">
                Browse open jobs
              </LinkButton>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold text-text-muted dark:text-slate-300">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />10,000+ candidate profiles</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />AI-ranked shortlists</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />ATS workflow included</span>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[2rem] border-primary/15 bg-surface/90 p-5 shadow-glow backdrop-blur dark:bg-slate-900/90">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4 border-b border-border pb-5 dark:border-white/10">
              <div>
                <p className="type-label text-primary">Live recruiter cockpit</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-text-main dark:text-white">Top matches for your job</h2>
                <p className="type-body mt-2 text-xs">Ranked by skills, experience, industry fit, and semantic profile analysis.</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>

            <StaggerContainer className="relative mt-5 grid gap-3">
              {[
                { name: "Md Jahid Anwar", roleName: "Admin & Operations", score: 94, skills: "4/4 skills matched" },
                { name: "Nusrat Jahan", roleName: "Customer Support", score: 88, skills: "3/4 skills matched" },
                { name: "Rahim Ahmed", roleName: "Frontend Developer", score: 82, skills: "Strong semantic fit" }
              ].map((candidate, index) => (
                <Card key={candidate.name} className="group flex items-center justify-between gap-4 bg-bg p-4 shadow-none dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-success text-sm font-black text-white">
                      {candidate.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-text-main dark:text-white">{candidate.name}</h3>
                        {index === 0 && <Badge variant="success">Top match</Badge>}
                      </div>
                      <p className="mt-1 text-xs font-semibold text-text-muted dark:text-slate-300">{candidate.roleName}</p>
                      <p className="mt-1 text-[11px] font-bold text-success dark:text-emerald-300">{candidate.skills} - ready for recruiter review</p>
                    </div>
                  </div>
                  <Badge variant="match-score" className="shrink-0">{candidate.score}%</Badge>
                </Card>
              ))}
            </StaggerContainer>

            <div className="relative mt-5 grid gap-3 rounded-2xl border border-border bg-white/70 p-4 dark:border-white/10 dark:bg-slate-950/40 sm:grid-cols-3">
              {outcomes.map((item) => (
                <div key={item.title}>
                  <p className="text-2xl font-black text-text-main dark:text-white">{item.label}</p>
                  <p className="mt-1 text-xs font-bold text-text-muted dark:text-slate-300">{item.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="py-10">
        <Container>
          <Card className="grid gap-4 rounded-3xl bg-text-main p-5 text-white shadow-elevated dark:bg-white dark:text-text-main md:grid-cols-4">
            {[
              { icon: Clock3, title: "Faster hiring", text: "From requirement to shortlist in 48 hours." },
              { icon: Target, title: "Better focus", text: "Review the strongest fits first." },
              { icon: ShieldCheck, title: "Verified flow", text: "Profiles, CVs, and actions stay traceable." },
              { icon: TrendingUp, title: "Pipeline clarity", text: "Know where every candidate stands." }
            ].map((item) => (
              <div key={item.title} className="flex gap-3 rounded-2xl bg-white/8 p-4 dark:bg-slate-100">
                <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-300 dark:text-primary" />
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/70 dark:text-text-muted">{item.text}</p>
                </div>
              </div>
            ))}
          </Card>
        </Container>
      </Section>

      <PageContainer className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} variant="interactive" className="rounded-3xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="type-h2 mt-6">{feature.title}</h2>
            <p className="mt-3 leading-7">{feature.text}</p>
          </Card>
        ))}
      </PageContainer>

      <PageContainer>
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Badge variant="primary" className="type-label text-primary">How MXVL works</Badge>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white">A cleaner hiring system from job post to final decision.</h2>
            <p className="type-body mt-4 max-w-xl">No more scattered spreadsheets, random CV folders, or lost follow-ups. The platform keeps candidates, jobs, support, and hiring actions connected.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={step.title} variant="interactive" className="rounded-3xl p-5">
                <Badge variant="neutral">Step {index + 1}</Badge>
                <h3 className="type-h3 mt-4 font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">{step.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>

      <PageContainer>
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <Badge variant="primary" className="type-label text-primary">Hiring categories</Badge>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white">Built for the roles Bangladeshi teams hire every week.</h2>
          </div>
          <LinkButton href="/we-hire-for-you" variant="secondary">We Hire for You</LinkButton>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((item) => (
            <Card key={item.title} variant="interactive" className="group overflow-hidden rounded-3xl p-0">
              <div className="h-28 bg-gradient-to-br from-primary/90 via-blue-500 to-success/80 p-5 text-white">
                <item.icon className="h-8 w-8" />
              </div>
              <div className="p-6">
                <h3 className="type-h2">{item.title}</h3>
                <p className="mt-3 leading-7">{item.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer>
        <Card className="rounded-3xl p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge variant="success">Explainable AI</Badge>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-text-main dark:text-white">Trust the score because you can see the reason.</h2>
              <p className="type-body mt-4">Every match can show skills matched, experience fit, semantic similarity, and missing gaps so recruiters make faster decisions without treating AI like a black box.</p>
            </div>
            <div className="space-y-4 rounded-3xl border border-border bg-bg p-5 dark:border-white/10 dark:bg-slate-900">
              {[
                { label: "Skills match", value: 40, color: "bg-success" },
                { label: "Experience match", value: 30, color: "bg-success" },
                { label: "Semantic similarity", value: 18, color: "bg-yellow-400" },
                { label: "Industry match", value: 10, color: "bg-success" }
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="mb-2 flex justify-between text-sm font-bold text-text-muted dark:text-slate-300">
                    <span>{bar.label}</span>
                    <span>{bar.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`${bar.color} h-2 rounded-full`} style={{ width: `${bar.value * 2}%`, maxWidth: "100%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </PageContainer>

      <PageContainer id="pricing">
        <div className="text-center">
          <Badge variant="primary">Flexible plans</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-text-main dark:text-white">Plans for every hiring pace</h2>
          <p className="type-body mx-auto mt-3 max-w-xl">Start with core hiring tools, then scale into managed recruitment and premium candidate access as your team grows.</p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {pricing.map((plan, index) => (
            <Card key={plan} variant={index === 1 ? "highlighted" : "interactive"} className="rounded-3xl">
              <div className="flex items-center justify-between">
                <h3 className="type-h2">{plan}</h3>
                {index === 1 && <Badge variant="primary">Popular</Badge>}
              </div>
              <p className="mt-3 leading-7">AI matching, recruiter workflow, candidate management, and hiring visibility.</p>
              <p className="mt-6 text-3xl font-black text-text-main dark:text-white">Custom</p>
              <LinkButton href="/login" className="mt-6 w-full">Start Hiring</LinkButton>
            </Card>
          ))}
        </div>
      </PageContainer>

      <Section>
        <Container>
          <Card className="mx-auto max-w-[1000px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-blue-600 to-slate-950 p-10 text-center text-white shadow-glow">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Layers3 className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">Stop screening. Start hiring.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75">Bring job posts, AI matches, support, CVs, and hiring progress into one polished operating system for recruitment.</p>
            <div className="mt-7 flex justify-center">
              <LinkButton href="/login" variant="secondary" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-primary hover:bg-white/90">Create account</LinkButton>
            </div>
          </Card>
        </Container>
      </Section>
    </main>
  );
}