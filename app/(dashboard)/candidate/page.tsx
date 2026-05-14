"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, FileText, Pencil, Save, Sparkles, UserRound, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import Input from "@/components/ui/Input";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import AccountSettings from "@/components/account/AccountSettings";
import SkillPicker from "@/components/skills/SkillPicker";
import StatsCards from "@/components/dashboard/StatsCards";
import AIInsights from "@/components/dashboard/AIInsights";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import ResumeSection from "@/components/dashboard/ResumeSection";
import InterviewSection from "@/components/dashboard/InterviewSection";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import type { CandidateAnalytics, CandidateDocument, CandidateNotification, CandidateProfile, InterviewEvent } from "@/types/candidate";
import type { CandidateApplication, JobRecommendation } from "@/types/application";

type CandidateTab = "home" | "profile" | "jobs" | "applied" | "resume";
type EditableSection = "profile" | "about" | "skills" | "experience" | "education" | "certifications" | "salary" | null;

type CandidateProfileState = {
  name: string;
  title: string;
  location: string;
  avatar: string | null;
  about: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications: {
    name: string;
    organization: string;
    year: string;
  }[];
  salary: {
    current: string;
    expected: string;
  };
};

const PROFILE_KEY = "mx_candidate_profile";
const MOCK_USER_KEY = "mx_mock_user";
const AUTH_CHANGE_EVENT = "mx-auth-change";

const applications = [
  {
    id: "app-1",
    title: "Senior Executive - Facility Management (Administration & Accounts)",
    company: "MX Ventures Lab",
    category: "HR & Admin",
    status: "Shortlisted",
    appliedDate: "4/27/2026"
  },
  {
    id: "app-2",
    title: "Admin & Operations Manager",
    company: "MX Ventures Lab",
    category: "HR & Admin",
    status: "Shortlisted",
    appliedDate: "4/27/2026"
  },
  {
    id: "app-3",
    title: "Customer Support Executive",
    company: "MX Ventures Lab",
    category: "Customer Service & Call Center",
    status: "Applied",
    appliedDate: "4/26/2026"
  }
];

const navItems: Array<{ id: CandidateTab; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "resume", label: "Resume Builder", icon: FileText }
];

const dashboardApplications: CandidateApplication[] = [
  {
    id: "dash-app-1",
    candidateId: "candidate-demo",
    jobId: "job-1",
    company: "MX Partner Employer",
    role: "Admin & Operations Manager",
    location: "Dhaka",
    status: "Shortlisted",
    matchScore: 94,
    recruiterNotes: "Strong admin operations fit. Invite for first round.",
    createdAt: "2026-04-28",
    updatedAt: "2026-05-05"
  },
  {
    id: "dash-app-2",
    candidateId: "candidate-demo",
    jobId: "job-2",
    company: "Remote Support BD",
    role: "Customer Support Executive",
    location: "Uttara",
    status: "Under Review",
    matchScore: 78,
    recruiterNotes: "Needs CRM proof.",
    createdAt: "2026-04-30",
    updatedAt: "2026-05-03"
  },
  {
    id: "dash-app-3",
    candidateId: "candidate-demo",
    jobId: "job-3",
    company: "Venture SaaS Lab",
    role: "Operations Coordinator",
    location: "Remote",
    status: "Interview",
    matchScore: 87,
    recruiterNotes: "Interview scheduled with operations lead.",
    createdAt: "2026-05-01",
    updatedAt: "2026-05-06"
  }
];

const dashboardDocuments: CandidateDocument[] = [
  { id: "doc-1", name: "ATS-CV.pdf", type: "Resume", url: "#", uploadedAt: "2026-05-02", score: 84 },
  { id: "doc-2", name: "HR-Operations-Certificate.pdf", type: "Certification", url: "#", uploadedAt: "2026-04-22", score: 91 }
];

const dashboardInterviews: InterviewEvent[] = [
  {
    id: "int-1",
    company: "MX Partner Employer",
    role: "Admin & Operations Manager",
    scheduledAt: "2026-05-09T11:00:00+06:00",
    meetingUrl: "https://meet.google.com/demo",
    checklist: ["Review job responsibilities", "Prepare vendor coordination example", "Bring latest ATS CV"],
    feedback: "Strong operations fit."
  }
];

const dashboardNotifications: CandidateNotification[] = [
  { id: "n-1", type: "interview", title: "Interview scheduled", message: "MX Partner Employer scheduled an interview for Admin & Operations Manager.", createdAt: "2026-05-06T09:10:00+06:00", isRead: false },
  { id: "n-2", type: "ai", title: "Resume suggestion", message: "Add quantified outcomes to your latest operations role to improve ATS strength.", createdAt: "2026-05-05T18:20:00+06:00", isRead: false },
  { id: "n-3", type: "application", title: "Application shortlisted", message: "Your profile moved to Shortlisted for Admin & Operations Manager.", createdAt: "2026-05-04T13:00:00+06:00", isRead: true }
];

const dashboardAnalytics: CandidateAnalytics = {
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

const dashboardRecommendedJobs: JobRecommendation[] = [
  { id: "rec-1", title: "Admin & Operations Manager", company: "MX Partner Employer", location: "Dhaka", workType: "On-site", matchScore: 94, salaryRange: "BDT 30k-50k", matchedSkills: ["Admin", "Excel", "Coordination"], missingSkills: ["ERP"], why: "Your operations and documentation background strongly matches this role." },
  { id: "rec-2", title: "HR & Admin Executive", company: "Growth Textile Ltd", location: "Savar", workType: "Hybrid", matchScore: 86, salaryRange: "BDT 25k-40k", matchedSkills: ["HR Operations", "Documentation"], missingSkills: ["Payroll"], why: "Strong HR administration overlap with manageable missing payroll exposure." }
];

function getInitials(name?: string | null) {
  if (!name) return "MX";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "MX";

  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function getDefaultProfile(user: ReturnType<typeof useAuth>["user"]): CandidateProfileState {
  const candidate = demoCandidates[0];
  const name = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.name || candidate.name;
  const userRecord = user as any;
  const metadata = userRecord?.user_metadata || {};
  const avatar =
    user?.avatar ||
    userRecord?.photo_url ||
    userRecord?.avatar_url ||
    metadata.avatar_url ||
    metadata.photo_url ||
    metadata.profile_photo_url ||
    metadata.picture ||
    candidate.avatar ||
    null;

  return {
    name,
    title: candidate.title,
    location: "Dhaka",
    avatar,
    about:
      "I am an Assistant Manager - Administration with 7+ years of experience supporting fast-growing organizations through efficient workplace, facilities, and operational management. Currently at Pathao, I work across site acquisition, vendor management, security operations, and renovation projects, ensuring smooth day-to-day operations in a dynamic, high-growth environment.",
    skills: candidate.skills.concat(["Photoshop", "Autocad 2d", "Sketchup 3d"]),
    experience: [
      {
        role: "Assistant Manager",
        company: "Pathao Limited",
        period: "Full-time | 2022-11 - Present",
        description:
          "Lead site acquisition and vendor coordination supporting operational locations. Oversee security operations and facility compliance, ensuring uninterrupted business continuity."
      }
    ],
    education: [
      {
        degree: "Bachelor of Science (B.Sc.), Agricultural Engineering",
        institution: "Hajee Mohammad Danesh Science & Technology University",
        year: "2015"
      }
    ],
    certifications: [
      {
        name: "Administrative Human Resources",
        organization: "LinkedIn",
        year: "2020"
      }
    ],
    salary: {
      current: "BDT 10,000",
      expected: "BDT 100,000"
    }
  };
}

function loadSavedProfile(user: ReturnType<typeof useAuth>["user"]) {
  const fallback = getDefaultProfile(user);

  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function ProfileAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={cn("rounded-full object-cover ring-2 ring-gray-200", className)} />
    );
  }

  return (
    <div className={cn("grid place-items-center rounded-full bg-gradient-to-br from-primary via-cyan-500 to-success font-black text-white ring-2 ring-gray-200", className)}>
      {getInitials(name)}
    </div>
  );
}

function SectionCard({
  title,
  onEdit,
  children
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="type-h3 font-bold">{title}</h3>
        <Button type="button" variant="secondary" onClick={onEdit} className="rounded-full px-3 py-1.5 text-xs">
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      {children}
    </Card>
  );
}

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "focus-ring min-h-32 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main placeholder:text-text-muted shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white",
        className
      )}
      {...props}
    />
  );
}

async function syncCandidateProfile(nextProfile: CandidateProfileState, user: ReturnType<typeof useAuth>["user"]) {
  if (!isSupabaseConfigured || !user?.id) return;

  const avatarUrl = nextProfile.avatar || null;
  const profilePatch = {
    id: user.id,
    email: user.email || "",
    full_name: nextProfile.name,
    name: nextProfile.name,
    role: "candidate",
    avatar_url: avatarUrl,
    photo_url: avatarUrl,
    profile_photo_url: avatarUrl,
    updated_at: new Date().toISOString()
  };

  await supabase.from("profiles").upsert(profilePatch, { onConflict: "id" });
  await supabase.auth.updateUser({
    data: {
      full_name: nextProfile.name,
      name: nextProfile.name,
      avatar_url: avatarUrl,
      photo_url: avatarUrl,
      profile_photo_url: avatarUrl,
      role: "candidate"
    }
  });

  const candidatePatch = {
    user_id: user.id,
    full_name: nextProfile.name,
    name: nextProfile.name,
    title: nextProfile.title,
    location: nextProfile.location,
    about: nextProfile.about,
    skills: nextProfile.skills,
    skills_array: nextProfile.skills,
    photo_url: avatarUrl,
    avatar: avatarUrl,
    category: demoCandidates[0]?.category || "HR & Admin",
    career_level: demoCandidates[0]?.experience || "Mid Level"
  };

  const { error } = await supabase.from("candidates").upsert(candidatePatch, { onConflict: "user_id" });
  if (error) {
    await supabase.from("candidates").update(candidatePatch).eq("user_id", user.id);
  }
}

function escapeHtml(value?: string | number | null) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getResumeFilename(name?: string | null) {
  const cleanName = (name || "Candidate")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return `Resume_of_${cleanName || "Candidate"}`;
}

function renderSkillList(skills: string[]) {
  return skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");
}

function renderExperienceList(experience: CandidateProfileState["experience"]) {
  return experience
    .map(
      (item) => `
        <article class="entry">
          <div class="entry-head">
            <div>
              <h3>${escapeHtml(item.role)}</h3>
              <p>${escapeHtml(item.company)}</p>
            </div>
            <strong>${escapeHtml(item.period)}</strong>
          </div>
          <p class="entry-copy">${escapeHtml(item.description)}</p>
        </article>
      `
    )
    .join("");
}

function renderEducationList(education: CandidateProfileState["education"]) {
  return education
    .map(
      (item) => `
        <article class="entry compact">
          <div class="entry-head">
            <div>
              <h3>${escapeHtml(item.degree)}</h3>
              <p>${escapeHtml(item.institution)}</p>
            </div>
            <strong>${escapeHtml(item.year)}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function renderCertificationList(certifications: CandidateProfileState["certifications"]) {
  return certifications
    .map(
      (item) => `
        <article class="entry compact">
          <div class="entry-head">
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.organization)}</p>
            </div>
            <strong>${escapeHtml(item.year)}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function buildCustomizedResumeHtml(profile: CandidateProfileState, email?: string | null) {
  const filename = getResumeFilename(profile.name);
  const initials = getInitials(profile.name);
  const avatarMarkup = profile.avatar
    ? `<img src="${escapeHtml(profile.avatar)}" alt="${escapeHtml(profile.name)}" />`
    : `<div class="avatar-initials">${escapeHtml(initials)}</div>`;

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(filename)}</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #eef2f7;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .resume-shell {
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          background: #ffffff;
          display: grid;
          grid-template-columns: 74mm 1fr;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.18);
        }
        aside {
          background: linear-gradient(180deg, #151923 0%, #202938 100%);
          color: #ffffff;
          padding: 34px 28px;
        }
        .avatar {
          width: 118px;
          height: 118px;
          border-radius: 999px;
          overflow: hidden;
          border: 4px solid rgba(255,255,255,0.9);
          background: linear-gradient(135deg, #2563eb, #16a34a);
          display: grid;
          place-items: center;
          margin-bottom: 26px;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-initials {
          font-size: 34px;
          font-weight: 900;
          letter-spacing: -0.06em;
        }
        .side-section {
          border-top: 1px solid rgba(255,255,255,0.18);
          padding-top: 20px;
          margin-top: 22px;
        }
        .side-section h2 {
          margin: 0 0 12px;
          color: #ffffff;
          font-size: 13px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .contact-line, .side-copy {
          margin: 0 0 9px;
          color: rgba(255,255,255,0.78);
          font-size: 12px;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }
        .side-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .side-skills span {
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 999px;
          padding: 5px 9px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
        }
        main {
          padding: 42px 42px 38px;
        }
        .brand-line {
          width: 64px;
          height: 5px;
          border-radius: 999px;
          background: #ef233c;
          margin-bottom: 22px;
        }
        h1 {
          margin: 0;
          color: #111827;
          font-size: 40px;
          line-height: 0.98;
          letter-spacing: -0.055em;
          text-transform: uppercase;
        }
        .title {
          margin: 10px 0 0;
          color: #ef233c;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .summary {
          margin: 26px 0;
          color: #4b5563;
          font-size: 13px;
          line-height: 1.8;
        }
        .section {
          margin-top: 25px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .section-title h2 {
          margin: 0;
          font-size: 15px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .section-title:after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .entry {
          border-left: 3px solid #ef233c;
          padding-left: 16px;
          margin-bottom: 18px;
        }
        .entry.compact {
          margin-bottom: 12px;
        }
        .entry-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .entry h3 {
          margin: 0;
          font-size: 15px;
          color: #111827;
        }
        .entry p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }
        .entry strong {
          flex: 0 0 auto;
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
          text-align: right;
          max-width: 150px;
        }
        .entry-copy {
          color: #4b5563 !important;
          font-size: 12px !important;
          line-height: 1.7;
        }
        .print-help {
          position: fixed;
          right: 20px;
          bottom: 20px;
          border: 0;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          padding: 12px 18px;
          font-weight: 800;
          box-shadow: 0 14px 40px rgba(37, 99, 235, 0.35);
        }
        @media print {
          body { background: #ffffff; }
          .resume-shell { margin: 0; box-shadow: none; }
          .print-help { display: none; }
        }
      </style>
    </head>
    <body>
      <section class="resume-shell">
        <aside>
          <div class="avatar">${avatarMarkup}</div>
          <div class="side-section" style="border-top:0;margin-top:0;padding-top:0;">
            <h2>Contact</h2>
            ${email ? `<p class="contact-line">${escapeHtml(email)}</p>` : ""}
            <p class="contact-line">${escapeHtml(profile.location)}</p>
          </div>
          <div class="side-section">
            <h2>Core Skills</h2>
            <div class="side-skills">${renderSkillList(profile.skills)}</div>
          </div>
          <div class="side-section">
            <h2>Profile</h2>
            <p class="side-copy">${escapeHtml(profile.title)}</p>
          </div>
        </aside>
        <main>
          <div class="brand-line"></div>
          <h1>${escapeHtml(profile.name)}</h1>
          <p class="title">${escapeHtml(profile.title)}</p>
          <p class="summary">${escapeHtml(profile.about)}</p>
          <section class="section">
            <div class="section-title"><h2>Experience</h2></div>
            ${renderExperienceList(profile.experience)}
          </section>
          <section class="section">
            <div class="section-title"><h2>Education</h2></div>
            ${renderEducationList(profile.education)}
          </section>
          <section class="section">
            <div class="section-title"><h2>Certifications</h2></div>
            ${renderCertificationList(profile.certifications)}
          </section>
        </main>
      </section>
      <button class="print-help" onclick="window.print()">Save as PDF</button>
    </body>
  </html>`;
}

function buildAtsResumeHtml(profile: CandidateProfileState, email?: string | null) {
  const filename = getResumeFilename(profile.name);

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(filename)}</title>
      <style>
        @page { size: A4; margin: 14mm 16mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #f3f4f6;
          color: #111827;
          font-family: "Times New Roman", Georgia, serif;
          line-height: 1.42;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .ats-page {
          width: 210mm;
          min-height: 297mm;
          margin: 24px auto;
          background: #ffffff;
          padding: 16mm 17mm;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.14);
        }
        header {
          text-align: center;
          border-bottom: 2px solid #111827;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        h1 {
          margin: 0;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 25px;
          line-height: 1.05;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .headline {
          margin: 7px 0 0;
          color: #374151;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .contact {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 4px 10px;
          margin: 8px auto 0;
          color: #374151;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10.5px;
        }
        section {
          margin-top: 13px;
        }
        h2 {
          margin: 0 0 7px;
          border-bottom: 1px solid #111827;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          line-height: 1.5;
          text-transform: uppercase;
        }
        p {
          margin: 0 0 7px;
          color: #1f2937;
          font-size: 11.5px;
        }
        .summary {
          text-align: justify;
        }
        .skills {
          font-size: 11.5px;
          font-weight: 700;
        }
        .entry {
          margin-bottom: 10px;
          break-inside: avoid;
        }
        .entry-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 3px;
        }
        .entry-title {
          margin: 0;
          color: #111827;
          font-size: 12px;
          font-weight: 800;
        }
        .entry-company {
          margin: 0;
          color: #374151;
          font-size: 11.5px;
          font-style: italic;
          font-weight: 700;
        }
        .entry-period {
          flex: 0 0 auto;
          color: #374151;
          font-size: 10.5px;
          font-weight: 700;
          text-align: right;
        }
        .entry-copy {
          margin: 3px 0 0;
          text-align: justify;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .print-help {
          position: fixed;
          right: 20px;
          bottom: 20px;
          border: 0;
          border-radius: 999px;
          background: #2563eb;
          color: #ffffff;
          padding: 12px 18px;
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 800;
          box-shadow: 0 14px 40px rgba(37, 99, 235, 0.35);
        }
        @media print {
          body { background: #ffffff; }
          .ats-page { margin: 0; width: auto; min-height: auto; padding: 0; box-shadow: none; }
          .print-help { display: none; }
        }
      </style>
    </head>
    <body>
      <main class="ats-page">
        <header>
          <h1>${escapeHtml(profile.name)}</h1>
          <p class="headline">${escapeHtml(profile.title)}</p>
          <div class="contact">
            ${email ? `<span>${escapeHtml(email)}</span><span>|</span>` : ""}
            <span>${escapeHtml(profile.location)}</span>
          </div>
        </header>

        <section>
          <h2>Career Summary</h2>
          <p class="summary">${escapeHtml(profile.about)}</p>
        </section>

        <section>
          <h2>Core Competencies</h2>
          <p class="skills">${escapeHtml(profile.skills.join(" | "))}</p>
        </section>

        <section>
          <h2>Professional Experience</h2>
          ${profile.experience.map((item) => `
            <article class="entry">
              <div class="entry-head">
                <div>
                  <p class="entry-title">${escapeHtml(item.role)}</p>
                  <p class="entry-company">${escapeHtml(item.company)}</p>
                </div>
                <span class="entry-period">${escapeHtml(item.period)}</span>
              </div>
              <p class="entry-copy">${escapeHtml(item.description)}</p>
            </article>
          `).join("")}
        </section>

        <div class="two-col">
          <section>
            <h2>Education</h2>
            ${profile.education.map((item) => `
              <article class="entry">
                <p class="entry-title">${escapeHtml(item.degree)}</p>
                <p>${escapeHtml(item.institution)}</p>
                <p>${escapeHtml(item.year)}</p>
              </article>
            `).join("")}
          </section>

          <section>
            <h2>Training & Certifications</h2>
            ${profile.certifications.map((item) => `
              <article class="entry">
                <p class="entry-title">${escapeHtml(item.name)}</p>
                <p>${escapeHtml(item.organization)}</p>
                <p>${escapeHtml(item.year)}</p>
              </article>
            `).join("")}
          </section>
        </div>
      </main>
      <button class="print-help" onclick="window.print()">Save as PDF</button>
    </body>
  </html>`;
}

function openResumeDocument(html: string, filename: string) {
  const resumeWindow = window.open("", "_blank", "width=980,height=1100");

  if (!resumeWindow) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  resumeWindow.document.open();
  resumeWindow.document.write(html);
  resumeWindow.document.close();
  resumeWindow.focus();
  window.setTimeout(() => resumeWindow.print(), 600);
}

export default function CandidateDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialTab = (searchParams.get("tab") as CandidateTab | null) || (searchParams.get("view") === "profile" ? "profile" : "home");
  const [activeTab, setActiveTab] = useState<CandidateTab>(navItems.some((item) => item.id === initialTab) ? initialTab : "home");
  const [profile, setProfile] = useState<CandidateProfileState>(() => loadSavedProfile(user));
  const [editing, setEditing] = useState<EditableSection>(null);
  const [draft, setDraft] = useState<CandidateProfileState>(() => loadSavedProfile(user));
  const candidate = demoCandidates[0];
  const matchedJobs = useMemo(
    () => demoJobs.map((job) => ({ job, match: matchCandidateToJob(candidate, job) })).sort((a, b) => b.match.score - a.match.score),
    [candidate]
  );
  const dashboardProfile: CandidateProfile = useMemo(() => ({
    id: "candidate-demo",
    userId: user?.id,
    name: profile.name,
    title: profile.title,
    email: user?.email || "",
    phone: "+880 1700 000000",
    location: profile.location,
    avatarUrl: profile.avatar || undefined,
    experienceLevel: candidate.experience,
    yearsExperience: 7,
    bio: profile.about,
    skills: profile.skills,
    socials: {
      linkedin: "https://linkedin.com/in/md-jahid-anwar",
      github: "",
      portfolio: ""
    },
    profileCompletion: 88,
    aiMatchScore: matchedJobs[0]?.match.score || 0,
    resumeScore: 84
  }), [candidate.experience, matchedJobs, profile, user?.email, user?.id]);

  useEffect(() => {
    const nextProfile = loadSavedProfile(user);
    setProfile(nextProfile);
    setDraft(nextProfile);
  }, [user]);

  const persistProfile = (nextProfile: CandidateProfileState) => {
    setProfile(nextProfile);
    setDraft(nextProfile);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));

    const storedMock = window.localStorage.getItem(MOCK_USER_KEY);
    const currentMock = storedMock ? JSON.parse(storedMock) : {};
    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      ...currentMock,
      name: nextProfile.name,
      avatar: nextProfile.avatar,
      role: "candidate",
      user_metadata: {
        ...currentMock.user_metadata,
        name: nextProfile.name,
        full_name: nextProfile.name,
        avatar_url: nextProfile.avatar,
        photo_url: nextProfile.avatar,
        profile_photo_url: nextProfile.avatar,
        role: "candidate"
      }
    }));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    void syncCandidateProfile(nextProfile, user).then(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });
  };

  const openEditor = (section: EditableSection) => {
    setDraft(profile);
    setEditing(section);
  };

  const closeEditor = () => {
    setDraft(profile);
    setEditing(null);
  };

  const saveEditor = async () => {
    persistProfile(draft);
    await syncCandidateProfile(draft, user);
    setEditing(null);
    setActiveTab("profile");
    router.replace("/candidate?view=profile");
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, avatar: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    window.localStorage.removeItem(MOCK_USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    router.push("/");
  };

  const downloadAtsCv = () => {
    const filename = getResumeFilename(profile.name);
    openResumeDocument(buildAtsResumeHtml(profile, user?.email), filename);
  };

  const downloadCustomizedCv = () => {
    const filename = getResumeFilename(profile.name);
    openResumeDocument(buildCustomizedResumeHtml(profile, user?.email), filename);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-bg dark:bg-slate-950">
      <Container className="py-6">
        <div className="mb-6 border-b border-border pb-6">
          <Badge variant="primary" className="type-label text-primary">Candidate Portal</Badge>
          <h1 className="type-h1 mt-3">Your Career Command Center</h1>
          <p className="type-body mt-3 max-w-xl">Manage your profile, discover matched jobs, track applications, and generate professional CVs.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <Card className="h-fit p-4 shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <ProfileAvatar src={profile.avatar} name={profile.name} className="h-12 w-12 text-sm" />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-text-main dark:text-white">{profile.name}</h2>
                <p className="truncate text-xs text-text-muted">{user?.email || "candidate.admin@mxventurelab.com"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-text-muted transition hover:bg-primary/5 hover:text-primary",
                      active && "border border-primary bg-primary/10 text-primary shadow-soft"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </Card>

          <main className="min-w-0">
            {activeTab === "home" ? (
              <div className="space-y-6">
                <StatsCards profile={dashboardProfile} applications={dashboardApplications} />

                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                  <Card className="overflow-hidden p-0 shadow-soft">
                    <div className="bg-gradient-to-br from-primary via-blue-500 to-success p-7 text-white">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">Candidate home</p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight">Your AI hiring command center is ready.</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                        Track profile strength, applications, interviews, resume health, and AI job recommendations from one place.
                      </p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        {["Improve profile", "Download CV", "Review matches"].map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => setActiveTab(action === "Download CV" ? "resume" : action === "Review matches" ? "jobs" : "profile")}
                            className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-black backdrop-blur transition hover:bg-white/25"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 shadow-soft">
                    <Badge variant="primary">Recent activity</Badge>
                    <div className="mt-5 space-y-4">
                      {[
                        "Profile viewed by MX Partner Employer",
                        "AI resume scan improved ATS score by 6%",
                        "Interview scheduled for Admin & Operations Manager",
                        "New recommended job found with 94% match"
                      ].map((item, index) => (
                        <div key={item} className="flex gap-3">
                          <span className="mt-1 grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                          <p className="text-sm font-semibold leading-6 text-text-muted dark:text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <AIInsights />
                  <JobRecommendations jobs={dashboardRecommendedJobs} />
                </div>

                <InterviewSection interviews={dashboardInterviews} />

                <div className="grid gap-6 xl:grid-cols-2">
                  <NotificationsPanel notifications={dashboardNotifications} />
                  <AnalyticsPanel analytics={dashboardAnalytics} />
                </div>

                <ResumeSection profile={dashboardProfile} documents={dashboardDocuments} />
                <ApplicationPipeline applications={dashboardApplications} />
              </div>
            ) : null}

            {activeTab === "profile" ? (
              <div className="grid gap-5">
                <Card className="flex flex-col justify-between gap-4 p-5 shadow-soft md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar src={profile.avatar} name={profile.name} className="h-16 w-16 text-base" />
                    <div>
                      <h2 className="type-h3 font-black">{profile.name}</h2>
                      <p className="type-body">{profile.title} | {candidate.experience} | {profile.location}</p>
                    </div>
                  </div>
                  <Button type="button" variant="success" onClick={() => openEditor("profile")} className="w-fit rounded-lg px-4 py-2">
                    Edit Profile
                  </Button>
                </Card>

                <SectionCard title="About" onEdit={() => openEditor("about")}>
                  <p className="type-body leading-7">{profile.about}</p>
                </SectionCard>

                <SectionCard title="Top Skills" onEdit={() => openEditor("skills")}>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="primary">{skill}</Badge>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Experience" onEdit={() => openEditor("experience")}>
                  <div className="grid gap-4 border-l-2 border-primary/30 pl-4">
                    {profile.experience.map((item) => (
                      <div key={`${item.role}-${item.company}`}>
                        <h4 className="text-sm font-black text-text-main dark:text-white">{item.role}</h4>
                        <p className="text-xs font-semibold text-text-muted">{item.company}</p>
                        <p className="mt-1 text-xs text-text-muted">{item.period}</p>
                        <p className="type-body mt-2 leading-6">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Education" onEdit={() => openEditor("education")}>
                  {profile.education.map((item) => (
                    <div key={`${item.degree}-${item.institution}`}>
                      <h4 className="text-sm font-black text-text-main dark:text-white">{item.degree}</h4>
                      <p className="type-body">{item.institution}</p>
                      <p className="text-xs text-text-muted">{item.year}</p>
                    </div>
                  ))}
                </SectionCard>

                <SectionCard title="Certifications" onEdit={() => openEditor("certifications")}>
                  {profile.certifications.map((item) => (
                    <div key={`${item.name}-${item.organization}`}>
                      <h4 className="text-sm font-black text-text-main dark:text-white">{item.name}</h4>
                      <p className="type-body">{item.organization}</p>
                      <p className="text-xs text-text-muted">{item.year}</p>
                    </div>
                  ))}
                </SectionCard>

                <SectionCard title="Salary" onEdit={() => openEditor("salary")}>
                  <div className="grid gap-3">
                    <div className="rounded-lg bg-primary/8 p-4 dark:bg-white/5">
                      <p className="type-label">Current Salary</p>
                      <p className="mt-1 text-sm font-bold text-text-main dark:text-white">{profile.salary.current}</p>
                    </div>
                    <div className="rounded-lg bg-primary/8 p-4 dark:bg-white/5">
                      <p className="type-label">Expected Salary</p>
                      <p className="mt-1 text-sm font-bold text-text-main dark:text-white">{profile.salary.expected}</p>
                    </div>
                    <p className="text-xs text-text-muted">Visible only to shortlisted employers.</p>
                  </div>
                </SectionCard>

                <AccountSettings profileStorageKey={PROFILE_KEY} title="Candidate Account" />
              </div>
            ) : null}

            {activeTab === "jobs" ? (
              <Card className="p-5 shadow-soft">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <Badge variant="primary" className="type-label text-primary">Available Jobs</Badge>
                    <h2 className="type-h2 mt-3">Matched Opportunities</h2>
                    <p className="type-body mt-2">Jobs are matched from employer requirements using your categories and skills.</p>
                  </div>
                  <LinkButton href="/jobs" variant="secondary">Browse all jobs</LinkButton>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {!matchedJobs.length ? (
                    <EmptyState
                      icon={<Sparkles size={22} />}
                      title="No matched opportunities yet"
                      message="Add more skills to your profile or broaden your preferred category to improve AI job matching."
                      actionLabel="Browse all jobs"
                      actionHref="/jobs"
                    />
                  ) : null}
                  {matchedJobs.slice(0, 2).map(({ job, match }) => (
                    <Card key={job.id} className="p-5 shadow-soft" variant="interactive">
                      <div className="flex items-start justify-between gap-3">
                        <Badge variant="primary" className="uppercase">{job.category}</Badge>
                        <Badge variant="match-score">{match.score}% match</Badge>
                      </div>
                      <h3 className="type-h3 mt-4 font-black">{job.title}</h3>
                      <p className="type-body mt-1">{job.company} | Any level</p>
                      <div className="mt-4 grid gap-2 text-xs text-text-muted">
                        <p><strong>Job Category:</strong> {job.category}</p>
                        <p><strong>Classification:</strong> {job.experience} | {job.jobType} | On-site</p>
                        <p><strong>Location:</strong> {job.location}</p>
                        <p><strong>Required Skills:</strong> {job.skills.join(", ")}</p>
                        <p><strong>Skills Matched:</strong> {match.matchedSkills.join(", ") || "No direct skill overlap yet"}</p>
                        <p><strong>Salary:</strong> Hidden by employer</p>
                      </div>
                      <div className="mt-5 grid gap-2">
                        <LinkButton href="/jobs" variant="success" className="w-full rounded-lg py-2">View Details</LinkButton>
                        <LinkButton href="/jobs" className="w-full rounded-lg py-2">Apply</LinkButton>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeTab === "applied" ? (
              <Card className="p-5 shadow-soft">
                <Badge variant="primary" className="type-label text-primary">Applied Jobs</Badge>
                <h2 className="type-h2 mt-3">Your Applications</h2>
                <p className="type-body mt-2">Track the roles you have applied for through MX.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {applications.map((application) => (
                    <Card key={application.id} className="p-5 shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-text-main dark:text-white">{application.title}</h3>
                          <p className="type-body text-xs">{application.company}</p>
                        </div>
                        <Badge variant={application.status === "Shortlisted" ? "primary" : "neutral"}>{application.status}</Badge>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-text-muted">
                        <p><strong>Category:</strong> {application.category}</p>
                        <p><strong>Applied Date:</strong> {application.appliedDate}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeTab === "resume" ? (
              <Card className="p-5 shadow-soft">
                <Badge variant="primary" className="type-label text-primary">Resume Builder</Badge>
                <h2 className="type-h2 mt-3">Professional CV Generator</h2>
                <p className="type-body mt-2">Generate ATS and customized CV versions from your profile data.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button type="button" onClick={downloadAtsCv} className="rounded-lg">Download ATS CV</Button>
                  <Button type="button" onClick={downloadCustomizedCv} variant="secondary" className="rounded-lg">Download Customized CV</Button>
                </div>
                <p className="mt-3 text-xs font-semibold text-text-muted">
                  Customized CV opens as a print-ready resume titled {getResumeFilename(profile.name)}.
                </p>
              </Card>
            ) : null}
          </main>
        </div>

        {editing ? (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
            <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 shadow-elevated">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <Badge variant="primary" className="type-label text-primary">Edit Section</Badge>
                  <h2 className="type-h2 mt-2 capitalize">{editing}</h2>
                </div>
                <button type="button" onClick={closeEditor} className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {editing === "profile" ? (
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar src={draft.avatar} name={draft.name} className="h-16 w-16 text-base" />
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-bg px-4 py-2 text-sm font-bold text-text-main transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white">
                      <Camera className="h-4 w-4" />
                      Update Photo
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                  <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Full name" />
                  <Input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Professional title" />
                  <Input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                </div>
              ) : null}

              {editing === "about" ? (
                <TextArea value={draft.about} onChange={(event) => setDraft((current) => ({ ...current, about: event.target.value }))} />
              ) : null}

              {editing === "skills" ? (
                <SkillPicker
                  selectedSkills={draft.skills}
                  onChange={(skills) => setDraft((current) => ({ ...current, skills }))}
                />
              ) : null}

              {editing === "experience" ? (
                <div className="grid gap-3">
                  <Input value={draft.experience[0]?.role || ""} onChange={(event) => setDraft((current) => ({ ...current, experience: [{ ...current.experience[0], role: event.target.value }] }))} placeholder="Role" />
                  <Input value={draft.experience[0]?.company || ""} onChange={(event) => setDraft((current) => ({ ...current, experience: [{ ...current.experience[0], company: event.target.value }] }))} placeholder="Company" />
                  <Input value={draft.experience[0]?.period || ""} onChange={(event) => setDraft((current) => ({ ...current, experience: [{ ...current.experience[0], period: event.target.value }] }))} placeholder="Period" />
                  <TextArea value={draft.experience[0]?.description || ""} onChange={(event) => setDraft((current) => ({ ...current, experience: [{ ...current.experience[0], description: event.target.value }] }))} placeholder="Description" />
                </div>
              ) : null}

              {editing === "education" ? (
                <div className="grid gap-3">
                  <Input value={draft.education[0]?.degree || ""} onChange={(event) => setDraft((current) => ({ ...current, education: [{ ...current.education[0], degree: event.target.value }] }))} placeholder="Degree" />
                  <Input value={draft.education[0]?.institution || ""} onChange={(event) => setDraft((current) => ({ ...current, education: [{ ...current.education[0], institution: event.target.value }] }))} placeholder="Institution" />
                  <Input value={draft.education[0]?.year || ""} onChange={(event) => setDraft((current) => ({ ...current, education: [{ ...current.education[0], year: event.target.value }] }))} placeholder="Year" />
                </div>
              ) : null}

              {editing === "certifications" ? (
                <div className="grid gap-3">
                  <Input value={draft.certifications[0]?.name || ""} onChange={(event) => setDraft((current) => ({ ...current, certifications: [{ ...current.certifications[0], name: event.target.value }] }))} placeholder="Certificate name" />
                  <Input value={draft.certifications[0]?.organization || ""} onChange={(event) => setDraft((current) => ({ ...current, certifications: [{ ...current.certifications[0], organization: event.target.value }] }))} placeholder="Organization" />
                  <Input value={draft.certifications[0]?.year || ""} onChange={(event) => setDraft((current) => ({ ...current, certifications: [{ ...current.certifications[0], year: event.target.value }] }))} placeholder="Year" />
                </div>
              ) : null}

              {editing === "salary" ? (
                <div className="grid gap-3">
                  <Input value={draft.salary.current} onChange={(event) => setDraft((current) => ({ ...current, salary: { ...current.salary, current: event.target.value } }))} placeholder="Current salary" />
                  <Input value={draft.salary.expected} onChange={(event) => setDraft((current) => ({ ...current, salary: { ...current.salary, expected: event.target.value } }))} placeholder="Expected salary" />
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button type="button" variant="secondary" onClick={closeEditor}>
                  Cancel
                </Button>
                <Button type="button" onClick={saveEditor}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </Container>
    </main>
  );
}
