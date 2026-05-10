"use client";

import { ArrowRight, Brain, CheckCircle2, KanbanSquare, Sparkles, Users } from "lucide-react";
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
  { icon: Brain, title: "AI Matching Engine", text: "Find the right candidate without manual filtering." },
  { icon: Users, title: "Candidate Scoring", text: "Compare skills, experience, category fit, and readiness in one view." },
  { icon: KanbanSquare, title: "Hiring Pipeline", text: "Move talent from applied to hired without leaving the platform." }
];

const steps = ["Submit role", "AI ranks candidates", "Review top 5-10", "Interview and hire"];
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
    <main className="overflow-hidden">
      <Section className="relative pt-28 pb-24 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_70%)]" />
        <Container className="grid items-center gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <Badge variant="primary" className="type-label text-primary">AI Hiring Platform</Badge>
            <h1 className="type-h1 mt-6 max-w-4xl leading-tight">
              Hire <span className="text-primary">Top Talent</span> in 48 Hours, Not 30 Days
            </h1>
            <p className="type-body mt-6 max-w-2xl">
              Skip hundreds of applications. Our AI ranks and delivers the top 5-10 candidates ready for your role.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/login">Get Started <ArrowRight className="ml-2 h-4 w-4" /></LinkButton>
              <LinkButton href={isEmployer ? "/employer#candidates" : "/jobs"} variant="secondary">
                {isEmployer ? "Find Candidates" : "Explore Jobs"}
              </LinkButton>
            </div>
            <div className="type-body mt-3 flex flex-wrap items-center gap-3 font-semibold">
              <span>10,000+ candidates</span>
              <span>90% match accuracy</span>
              <span>48h hiring</span>
            </div>
          </div>

          <Card className="relative animate-float overflow-hidden border-primary/15 bg-surface/90 shadow-glow backdrop-blur dark:bg-slate-900/90">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="type-label text-primary">Top Matches for Your Job</p>
                <p className="type-body mt-2 text-xs">Ranked by AI based on skills, experience, and job fit</p>
              </div>
              <Sparkles className="text-primary" />
            </div>
            <StaggerContainer className="relative mt-6 grid gap-3">
              {["Md Jahid Anwar", "Nusrat Jahan", "Rahim Ahmed"].map((name, index) => (
                <Card key={name} className="flex items-center justify-between bg-bg shadow-none dark:bg-white/5">
                  <div>
                    <h3 className="type-h3 font-bold">{name}</h3>
                    <p className="mt-1 text-[11px] font-semibold text-success dark:text-emerald-300">3/4 skills matched - Strong experience fit</p>
                  </div>
                  <Badge variant="match-score">{94 - index * 6}%</Badge>
                </Card>
              ))}
            </StaggerContainer>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container className="text-center">
          <Badge variant="danger">Most companies take 30-45 days to hire.</Badge>
          <p className="type-h3 mt-2 font-bold">We reduce it to under 48 hours.</p>
        </Container>
      </Section>

      <PageContainer className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} variant="interactive">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="type-h2 mt-6">{feature.title}</h2>
            <p className="mt-3">{feature.text}</p>
          </Card>
        ))}
      </PageContainer>

      <PageContainer>
        <div className="max-w-2xl">
          <Badge variant="primary" className="type-label text-primary">Process</Badge>
          <h2 className="type-h2 mt-3">From job post to top candidates in under 48 hours</h2>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step} variant="interactive">
              <Badge variant="neutral">0{index + 1}</Badge>
              <h3 className="type-h3 mt-3">{step}</h3>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="grid gap-6 md:grid-cols-3">
        {["Blue Collar", "White Collar", "Business Promoters"].map((item) => (
          <Card key={item} variant="interactive">
            <CheckCircle2 className="text-success" />
            <h2 className="type-h2 mt-6">{item}</h2>
            <p className="mt-3">Curated categories with scored, ready-to-review candidates.</p>
          </Card>
        ))}
      </PageContainer>

      <PageContainer id="pricing">
        <div className="text-center">
          <h2 className="type-h2">Plans for every hiring pace</h2>
          <p className="mt-3">Start lean, scale when hiring volume grows.</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {pricing.map((plan, index) => (
            <Card key={plan} variant={index === 1 ? "highlighted" : "interactive"}>
              <h3 className="type-h3">{plan}</h3>
              <p className="mt-3">AI matching, recruiter workflow, and candidate access.</p>
              <p className="type-h2 mt-6 font-bold">Custom</p>
              <LinkButton href="/login" className="mt-6 w-full">Start Hiring</LinkButton>
            </Card>
          ))}
        </div>
      </PageContainer>

      <Section>
        <Container>
          <Card className="mx-auto max-w-[1000px] bg-text-main p-10 text-center text-white shadow-glow dark:bg-white dark:text-text-main">
            <h2 className="type-h1">Stop Screening. Start Hiring.</h2>
            <p className="type-body mt-3 text-white/70 dark:text-text-muted">Build a shorter path from role requirement to confident hiring decision.</p>
            <LinkButton href="/login" className="mt-6">Create Account</LinkButton>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
