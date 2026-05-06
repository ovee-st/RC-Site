"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatsCards from "@/components/dashboard/StatsCards";
import ProfileCard from "@/components/dashboard/ProfileCard";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import ResumeSection from "@/components/dashboard/ResumeSection";
import AIInsights from "@/components/dashboard/AIInsights";
import AssessmentSection from "@/components/dashboard/AssessmentSection";
import InterviewSection from "@/components/dashboard/InterviewSection";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import MessagingPanel from "@/components/dashboard/MessagingPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { CandidateAnalytics, CandidateDocument, CandidateNotification, CandidateProfile, InterviewEvent, RecruiterMessage, SkillAssessment } from "@/types/candidate";
import type { CandidateApplication, JobRecommendation } from "@/types/application";

const fallbackProfile: CandidateProfile = {
  id: "candidate-demo",
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
    portfolio: "https://portfolio.example.com"
  },
  profileCompletion: 88,
  aiMatchScore: 92,
  resumeScore: 84
};

const fallbackApplications: CandidateApplication[] = [
  { id: "app-1", candidateId: "candidate-demo", jobId: "job-1", company: "MX Partner Employer", role: "Admin & Operations Manager", location: "Dhaka", status: "Shortlisted", matchScore: 94, recruiterNotes: "Strong admin operations fit. Invite for first round.", createdAt: "2026-04-28", updatedAt: "2026-05-05" },
  { id: "app-2", candidateId: "candidate-demo", jobId: "job-2", company: "Remote Support BD", role: "Customer Support Executive", location: "Uttara", status: "Under Review", matchScore: 78, recruiterNotes: "Needs CRM proof.", createdAt: "2026-04-30", updatedAt: "2026-05-03" },
  { id: "app-3", candidateId: "candidate-demo", jobId: "job-3", company: "Venture SaaS Lab", role: "Operations Coordinator", location: "Remote", status: "Interview", matchScore: 87, recruiterNotes: "Interview scheduled with operations lead.", createdAt: "2026-05-01", updatedAt: "2026-05-06" }
];

const documents: CandidateDocument[] = [
  { id: "doc-1", name: "Md-Jahid-Anwar-ATS-CV.pdf", type: "Resume", url: "#", uploadedAt: "2026-05-02", score: 84 },
  { id: "doc-2", name: "HR-Operations-Certificate.pdf", type: "Certification", url: "#", uploadedAt: "2026-04-22", score: 91 }
];

const assessments: SkillAssessment[] = [
  { id: "assess-1", title: "Admin Operations MCQ", category: "Operations", score: 88, level: "Advanced", status: "Completed", summary: "Strong documentation, coordination, and workflow control." },
  { id: "assess-2", title: "Excel Reporting Challenge", category: "Data", score: 82, level: "Upper Intermediate", status: "Completed", summary: "Good spreadsheet structure and reporting discipline." },
  { id: "assess-3", title: "Communication Scenario Test", category: "Communication", score: 76, level: "Recommended", status: "Recommended", summary: "Recommended to improve recruiter-facing communication signals." }
];

const interviews: InterviewEvent[] = [
  { id: "int-1", company: "MX Partner Employer", role: "Admin & Operations Manager", scheduledAt: "2026-05-09T11:00:00+06:00", meetingUrl: "https://meet.google.com/demo", checklist: ["Review job responsibilities", "Prepare vendor coordination example", "Bring latest ATS CV"], feedback: "Strong operations fit." }
];

const notifications: CandidateNotification[] = [
  { id: "n-1", type: "interview", title: "Interview scheduled", message: "MX Partner Employer scheduled an interview for Admin & Operations Manager.", createdAt: "2026-05-06T09:10:00+06:00", isRead: false },
  { id: "n-2", type: "ai", title: "Resume suggestion", message: "Add quantified outcomes to your latest operations role to improve ATS strength.", createdAt: "2026-05-05T18:20:00+06:00", isRead: false },
  { id: "n-3", type: "application", title: "Application shortlisted", message: "Your profile moved to Shortlisted for Admin & Operations Manager.", createdAt: "2026-05-04T13:00:00+06:00", isRead: true }
];

const threads: RecruiterMessage[] = [
  { id: "msg-1", recruiter: "Ovee Rahman", company: "MX Partner Employer", lastMessage: "Can you confirm your availability for Saturday?", timestamp: "10:24 AM", unread: 2, messages: [
    { id: "m1", sender: "recruiter", body: "Your profile is a strong fit for our operations role.", timestamp: "09:40" },
    { id: "m2", sender: "candidate", body: "Thank you. I am available for an interview this week.", timestamp: "10:02" },
    { id: "m3", sender: "recruiter", body: "Can you confirm your availability for Saturday?", timestamp: "10:24" }
  ] }
];

const analytics: CandidateAnalytics = {
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

const recommendedJobs: JobRecommendation[] = [
  { id: "rec-1", title: "Admin & Operations Manager", company: "MX Partner Employer", location: "Dhaka", workType: "On-site", matchScore: 94, salaryRange: "BDT 30k-50k", matchedSkills: ["Admin", "Excel", "Coordination"], missingSkills: ["ERP"], why: "Your operations and documentation background strongly matches this role." },
  { id: "rec-2", title: "HR & Admin Executive", company: "Growth Textile Ltd", location: "Savar", workType: "Hybrid", matchScore: 86, salaryRange: "BDT 25k-40k", matchedSkills: ["HR Operations", "Documentation"], missingSkills: ["Payroll"], why: "Strong HR administration overlap with manageable missing payroll exposure." }
];

export default function CandidateDashboardPage() {
  const [profile, setProfile] = useState(fallbackProfile);
  const [activeSection, setActiveSection] = useState("home");
  const [applications] = useState(fallbackApplications);
  const activeApplications = applications.filter((application) => application.status !== "Rejected");

  useEffect(() => {
    let active = true;
    async function loadCandidateProfile() {
      if (!isSupabaseConfigured) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user || !active) return;
      const { data } = await supabase.from("candidates").select("*").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      setProfile((current) => ({
        ...current,
        id: data?.id || current.id,
        userId: user.id,
        name: data?.name || user.user_metadata?.name || current.name,
        email: data?.email || user.email || "",
        phone: data?.phone || current.phone,
        avatarUrl: data?.photo_url || user.user_metadata?.avatar_url || current.avatarUrl,
        title: data?.title || data?.career_level || current.title,
        location: data?.location || current.location,
        bio: data?.about || current.bio,
        skills: Array.isArray(data?.skills) && data.skills.length ? data.skills : current.skills,
        socials: { ...current.socials, linkedin: data?.linkedin || current.socials.linkedin }
      }));
    }
    loadCandidateProfile().catch(() => null);
    return () => { active = false; };
  }, []);

  const recentActivity = useMemo(() => [
    "Profile viewed by MX Partner Employer",
    "AI resume scan improved ATS score by 6%",
    "Interview scheduled for Admin & Operations Manager",
    "New recommended job found with 94% match"
  ], []);

  function renderSection() {
    switch (activeSection) {
      case "profile": return <ProfileCard profile={profile} onProfileUpdate={setProfile} />;
      case "resume": return <ResumeSection profile={profile} documents={documents} />;
      case "applications": return <ApplicationPipeline applications={applications} />;
      case "assistant": return <AIInsights />;
      case "assessments": return <AssessmentSection assessments={assessments} />;
      case "interviews": return <InterviewSection interviews={interviews} />;
      case "notifications": return <NotificationsPanel notifications={notifications} />;
      case "messages": return <MessagingPanel threads={threads} />;
      case "analytics": return <AnalyticsPanel analytics={analytics} />;
      default:
        return (
          <div className="space-y-6">
            <StatsCards profile={profile} applications={applications} />
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="overflow-hidden p-0">
                <div className="bg-gradient-to-br from-primary via-blue-500 to-success p-7 text-white">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Welcome banner</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight">You are close to your next shortlist.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Your profile is {profile.profileCompletion}% complete, with {activeApplications.length} active applications and {profile.aiMatchScore}% average AI fit across recommended jobs.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {["Upload stronger CV", "Practice interview", "Review top jobs"].map((action) => <button key={action} className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-black backdrop-blur transition hover:bg-white/25">{action}</button>)}
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <Badge variant="primary">Recent activity</Badge>
                <div className="mt-5 space-y-4">{recentActivity.map((item, index) => <div key={item} className="flex gap-3"><span className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span><p className="text-sm font-semibold leading-6 text-text-muted dark:text-slate-300">{item}</p></div>)}</div>
              </Card>
            </div>
            <div className="grid gap-6 xl:grid-cols-2"><AIInsights /><JobRecommendations jobs={recommendedJobs} /></div>
            <ApplicationPipeline applications={applications} />
          </div>
        );
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text-main dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 sm:px-6">
        <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
        <div className="min-w-0 flex-1">
          <Topbar profile={profile} />
          <motion.div key={activeSection} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
