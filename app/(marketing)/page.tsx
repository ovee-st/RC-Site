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
import PublicHome from "@/components/home/PublicHome";
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
          <StatsCards profile={profile} applications={candidateHomeApplications} upcomingInterviews={candidateHomeInterviews.length} />

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
            <div id="candidate-interviews-section" className="scroll-mt-24">
              <InterviewSection interviews={candidateHomeInterviews} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <NotificationsPanel notifications={candidateHomeNotifications} />
            <AnalyticsPanel analytics={candidateHomeAnalytics} />
          </div>

          <ResumeSection profile={profile} documents={candidateHomeDocuments} />
          <div id="candidate-applications-section" className="scroll-mt-24">
            <ApplicationPipeline applications={candidateHomeApplications} />
          </div>
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

  return <PublicHome />;
}


