"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, FileText, Pencil, Plus, Save, Sparkles, Trash2, UserRound, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import Input from "@/components/ui/Input";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { jobLocationOptions } from "@/lib/jobOptions";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY } from "@/lib/accountIdentity";
import { authSafeAvatarAliases, avatarAliases, normalizeProfileImageUrl, stripInlineAuthAvatarMetadata, syncProfileImageState } from "@/lib/profileImageSync";
import AccountSettings from "@/components/account/AccountSettings";
import SkillPicker from "@/components/skills/SkillPicker";
import StatsCards from "@/components/dashboard/StatsCards";
import AIProfileCoach from "@/components/candidate/AIProfileCoach";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import ResumeSection from "@/components/dashboard/ResumeSection";
import InterviewSection from "@/components/dashboard/InterviewSection";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import JobRecommendations from "@/components/dashboard/JobRecommendations";
import type { CandidateAnalytics, CandidateDocument, CandidateProfile, InterviewEvent } from "@/types/candidate";
import type { CandidateApplication, JobRecommendation } from "@/types/application";

type CandidateTab = "home" | "profile" | "jobs" | "applied" | "resume";
type EditableSection = "profile" | "about" | "skills" | "experience" | "education" | "certifications" | "salary" | "availability" | null;

type CandidateProfileState = {
  name: string;
  title: string;
  location: string;
  preferredJobLocation: string;
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
  availability: {
    immediate: boolean;
    noticePeriod: string;
    noticeUnit: "Days" | "Months";
  };
};

const PROFILE_KEY = "mx_candidate_profile";

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
    preferredJobLocation: "On-site",
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
    },
    availability: {
      immediate: true,
      noticePeriod: "",
      noticeUnit: "Days"
    }
  };
}

const createEmptyExperience = (): CandidateProfileState["experience"][number] => ({
  role: "",
  company: "",
  period: "",
  description: ""
});

const createEmptyEducation = (): CandidateProfileState["education"][number] => ({
  degree: "",
  institution: "",
  year: ""
});

const createEmptyCertification = (): CandidateProfileState["certifications"][number] => ({
  name: "",
  organization: "",
  year: ""
});

function normalizeProfile(profile: CandidateProfileState): CandidateProfileState {
  return {
    ...profile,
    preferredJobLocation: profile.preferredJobLocation || "",
    availability: {
      immediate: profile.availability?.immediate ?? true,
      noticePeriod: profile.availability?.noticePeriod || "",
      noticeUnit: profile.availability?.noticeUnit === "Months" ? "Months" : "Days"
    }
  };
}

function loadSavedProfile(user: ReturnType<typeof useAuth>["user"]) {
  const fallback = getDefaultProfile(user);

  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    return saved ? normalizeProfile({ ...fallback, ...JSON.parse(saved) }) : fallback;
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
  onAdd,
  addLabel = "Add",
  children
}: {
  title: string;
  onEdit: () => void;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="type-h3 font-bold">{title}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onAdd ? (
            <Button type="button" variant="secondary" onClick={onAdd} className="rounded-full px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              {addLabel}
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onEdit} className="rounded-full px-3 py-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
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

  const avatarUrl = normalizeProfileImageUrl(nextProfile.avatar);
  const profilePatch = {
    id: user.id,
    email: user.email || "",
    full_name: nextProfile.name,
    name: nextProfile.name,
    role: "candidate",
    ...avatarAliases(avatarUrl),
    updated_at: new Date().toISOString()
  };

  await supabase.from("profiles").upsert(profilePatch, { onConflict: "id" });
  await supabase.auth.updateUser({
    data: {
      ...stripInlineAuthAvatarMetadata(user.user_metadata || {}),
      full_name: nextProfile.name,
      name: nextProfile.name,
      ...authSafeAvatarAliases(avatarUrl),
      role: "candidate"
    }
  });

  const candidatePatch = {
    user_id: user.id,
    full_name: nextProfile.name,
    name: nextProfile.name,
    title: nextProfile.title,
    location: nextProfile.location,
    preferred_job_location: nextProfile.preferredJobLocation || null,
    about: nextProfile.about,
    skills: nextProfile.skills,
    skills_array: nextProfile.skills,
    ...avatarAliases(avatarUrl),
    category: demoCandidates[0]?.category || "HR & Admin",
    career_level: demoCandidates[0]?.experience || "Mid Level",
    immediate_availability: nextProfile.availability.immediate,
    notice_period_value: nextProfile.availability.immediate ? null : Number(nextProfile.availability.noticePeriod) || null,
    notice_period_unit: nextProfile.availability.immediate ? null : nextProfile.availability.noticeUnit
  };

  const { error } = await supabase.from("candidates").upsert(candidatePatch, { onConflict: "user_id" });
  if (error) {
    const missingAvailabilityColumns = /immediate_availability|notice_period|preferred_job_location/i.test(error.message || "");
    if (missingAvailabilityColumns) {
      const { immediate_availability, notice_period_value, notice_period_unit, preferred_job_location, ...fallbackPatch } = candidatePatch;
      const { error: fallbackError } = await supabase.from("candidates").upsert(fallbackPatch, { onConflict: "user_id" });
      if (fallbackError) {
        await supabase.from("candidates").update(fallbackPatch).eq("user_id", user.id);
      }
      return;
    }

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
  const [matchPanelOpen, setMatchPanelOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<{ title: string; status: string; description: string; actionLabel: string; action: () => void } | null>(null);
  const candidate = demoCandidates[0];
  const matchedJobs = useMemo(
    () => demoJobs.map((job) => ({ job, match: matchCandidateToJob(candidate, job) })).sort((a, b) => b.match.score - a.match.score),
    [candidate]
  );
  const floatingMatches = useMemo(() => matchedJobs.filter(({ match }) => match.score >= 70).slice(0, 5), [matchedJobs]);
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

  const recentActivities = useMemo(() => [
    {
      title: "Profile viewed by MX Partner Employer",
      status: "Viewed today",
      description: "Your profile was opened by MX Partner Employer. Keep your skills and availability updated so recruiters can shortlist faster.",
      actionLabel: "Open profile",
      action: () => setActiveTab("profile")
    },
    {
      title: "AI resume scan improved ATS score by 6%",
      status: "Resume health improved",
      description: "Your latest profile data improved resume strength. Review the resume builder to download the updated ATS or customized CV.",
      actionLabel: "Open resume builder",
      action: () => setActiveTab("resume")
    },
    {
      title: "Interview scheduled for Admin & Operations Manager",
      status: "Interview scheduled",
      description: "Interview preparation checklist and meeting details are available in your interview section.",
      actionLabel: "View interview",
      action: () => document.getElementById("candidate-interviews-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    {
      title: `New recommended job found with ${floatingMatches[0]?.match.score || 0}% match`,
      status: `${floatingMatches.length} strong match${floatingMatches.length === 1 ? "" : "es"} available`,
      description: floatingMatches[0] ? `${floatingMatches[0].job.title} is currently your strongest open-role fit based on skills and profile signals.` : "No 70%+ matches are available yet. Add more skills to improve recommendations.",
      actionLabel: "Review matches",
      action: () => setMatchPanelOpen(true)
    }
  ], [floatingMatches]);

  const performanceAnalytics = useMemo<CandidateAnalytics>(() => {
    const activeStatuses = ["Applied", "Under Review", "Shortlisted", "Interview", "Offer", "Hired"];
    const responseStatuses = ["Under Review", "Shortlisted", "Interview", "Offer", "Hired"];
    const filledExperience = profile.experience.filter((item) => item.role || item.company || item.description).length;
    const filledEducation = profile.education.filter((item) => item.degree || item.institution).length;
    const filledCertifications = profile.certifications.filter((item) => item.name || item.organization).length;
    const skillCount = profile.skills.filter(Boolean).length;
    const activeApplications = dashboardApplications.filter((application) => activeStatuses.includes(application.status)).length;
    const responses = dashboardApplications.filter((application) => responseStatuses.includes(application.status)).length;
    const interviewCount = Math.max(
      dashboardInterviews.length,
      dashboardApplications.filter((application) => /interview/i.test(application.status)).length
    );
    const responseRate = dashboardApplications.length ? Math.round((responses / dashboardApplications.length) * 100) : 0;
    const averageMatchScore = dashboardApplications.length
      ? Math.round(dashboardApplications.reduce((sum, application) => sum + application.matchScore, 0) / dashboardApplications.length)
      : matchedJobs[0]?.match.score || 0;
    const profileCompleteness = Math.min(100,
      (profile.name ? 10 : 0) +
      (profile.title ? 10 : 0) +
      (profile.about ? 15 : 0) +
      (profile.location ? 10 : 0) +
      (skillCount ? 20 : 0) +
      (filledExperience ? 20 : 0) +
      (filledEducation ? 10 : 0) +
      (filledCertifications ? 5 : 0)
    );
    const resumeScore = Math.min(100, Math.round(profileCompleteness * 0.55 + averageMatchScore * 0.3 + responseRate * 0.15));
    const atsOptimization = Math.min(100, Math.round(resumeScore + Math.min(skillCount, 8)));
    const experienceStrength = Math.min(100, Math.round(45 + filledExperience * 18 + interviewCount * 8));
    const skillsCoverage = Math.min(100, Math.round(skillCount * 12 + averageMatchScore * 0.25));
    const keywordMatch = Math.min(100, Math.round(averageMatchScore * 0.75 + responseRate * 0.25));
    const profileViews = Math.max(
      recentActivities.filter((activity) => /view/i.test(activity.title)).length,
      activeApplications * 18 + matchedJobs.filter(({ match }) => match.score >= 70).length * 7
    );

    return {
      applicationSuccessRate: resumeScore,
      interviewsCompleted: interviewCount,
      recruiterResponseRate: responseRate,
      profileViews,
      resumeScore,
      atsOptimization,
      experienceStrength,
      skillsCoverage,
      keywordMatch,
      skillTrends: [
        { skill: "ATS Optimization", value: atsOptimization },
        { skill: "Experience Strength", value: experienceStrength },
        { skill: "Skills Coverage", value: skillsCoverage },
        { skill: "Keyword Match", value: keywordMatch }
      ]
    };
  }, [matchedJobs, profile, recentActivities]);

  useEffect(() => {
    const nextProfile = loadSavedProfile(user);
    setProfile(nextProfile);
    setDraft(nextProfile);
  }, [user]);

  const persistProfile = (nextProfile: CandidateProfileState) => {
    const normalizedProfile = { ...nextProfile, avatar: normalizeProfileImageUrl(nextProfile.avatar) };
    setProfile(normalizedProfile);
    setDraft(normalizedProfile);
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({
      ...normalizedProfile,
      ...avatarAliases(normalizedProfile.avatar)
    }));

    syncProfileImageState({
      role: "candidate",
      name: normalizedProfile.name,
      avatarUrl: normalizedProfile.avatar,
      profileStorageKey: PROFILE_KEY,
      profilePatch: normalizedProfile
    });
    void syncCandidateProfile(normalizedProfile, user).then(() => {
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    });
  };

  const openEditor = (section: EditableSection) => {
    setDraft(profile);
    setEditing(section);
  };

  const openAddEditor = (section: "experience" | "education" | "certifications") => {
    const nextDraft = { ...profile };

    if (section === "experience") {
      nextDraft.experience = [...profile.experience, createEmptyExperience()];
    }

    if (section === "education") {
      nextDraft.education = [...profile.education, createEmptyEducation()];
    }

    if (section === "certifications") {
      nextDraft.certifications = [...profile.certifications, createEmptyCertification()];
    }

    setDraft(nextDraft);
    setEditing(section);
  };

  const closeEditor = () => {
    setDraft(profile);
    setEditing(null);
  };

  const saveEditor = () => {
    const nextProfile = draft;
    persistProfile(nextProfile);
    setEditing(null);
    setActiveTab("profile");
    router.replace("/candidate?view=profile");
    void syncCandidateProfile(nextProfile, user).catch((error) => {
      console.error("Candidate profile sync failed", error);
    });
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
      <Container className="py-5">
        <div className="mb-5 border-b border-border pb-5">
          <Badge variant="primary" className="type-label text-primary">Candidate Portal</Badge>
          <h1 className="type-h1 mt-2">Your Career Command Center</h1>
          <p className="type-body mt-2 max-w-xl">Manage your profile, discover matched jobs, track applications, and generate professional CVs.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <Card className="h-fit p-3 shadow-soft lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <ProfileAvatar src={profile.avatar} name={profile.name} className="h-12 w-12 text-sm" />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-text-main dark:text-white">{profile.name}</h2>
                <p className="truncate text-xs text-text-muted">{user?.email || "candidate.admin@mxventurelab.com"}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-1">
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
              <div className="space-y-4">
                <StatsCards profile={dashboardProfile} applications={dashboardApplications} />

                <div className="grid grid-cols-12 gap-4">
                  <Card className="col-span-12 overflow-hidden p-0 shadow-soft lg:col-span-5">
                    <div className="bg-gradient-to-br from-primary via-blue-500 to-success p-4 text-white md:p-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">Candidate home</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">Your AI hiring command center is ready.</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
                        Track profile strength, applications, interviews, resume health, and AI job recommendations from one place.
                      </p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {[
                          { label: "Improve profile", onClick: () => setActiveTab("profile") },
                          { label: "Download CV", onClick: () => setActiveTab("resume") },
                          { label: "Review matches", onClick: () => setMatchPanelOpen(true) }
                        ].map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            onClick={action.onClick}
                            className="rounded-2xl border border-white/30 bg-white/15 px-3 py-2.5 text-xs font-black backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/25 md:text-sm"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="col-span-12 p-4 shadow-soft lg:col-span-7">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Badge variant="primary">Recent activity</Badge>
                        <h2 className="mt-2 text-lg font-black text-text-main dark:text-white">Career signals</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMatchPanelOpen(true)}
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-black text-text-muted transition hover:border-primary hover:text-primary dark:border-white/10 dark:text-slate-300"
                      >
                        View matches
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {recentActivities.map((item, index) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => setSelectedActivity(item)}
                          className="group flex w-full gap-3 rounded-2xl border border-transparent bg-bg/60 p-3 text-left transition hover:border-primary/20 hover:bg-primary/5 dark:bg-white/5"
                        >
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold leading-5 text-text-main transition group-hover:text-primary dark:text-white">{item.title}</span>
                            <span className="mt-0.5 block truncate text-xs font-semibold text-text-muted dark:text-slate-400">{item.status}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <div className="col-span-12 lg:col-span-5">
                    <AIProfileCoach
                      userId={user?.id}
                      plan="Basic"
                      profile={{
                        name: dashboardProfile.name,
                        title: dashboardProfile.title,
                        about: profile.about,
                        location: dashboardProfile.location,
                        skills: profile.skills,
                        experience: profile.experience,
                        education: profile.education,
                        certifications: profile.certifications,
                        salary: profile.salary,
                        availability: profile.availability,
                        profileCompletion: dashboardProfile.profileCompletion,
                        resumeScore: dashboardProfile.resumeScore
                      }}
                    />
                  </div>

                  <div className="col-span-12 lg:col-span-7">
                    <JobRecommendations jobs={dashboardRecommendedJobs} />
                  </div>

                  <div id="candidate-interviews-section" className="col-span-12 lg:col-span-6">
                    <InterviewSection interviews={dashboardInterviews} />
                  </div>

                  <div className="col-span-12 lg:col-span-6">
                    <AnalyticsPanel analytics={performanceAnalytics} />
                  </div>

                  <div className="col-span-12">
                    <ResumeSection profile={dashboardProfile} documents={dashboardDocuments} />
                  </div>

                  <div className="col-span-12">
                    <ApplicationPipeline applications={dashboardApplications} />
                  </div>
                </div>
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

                <SectionCard title="Experience" onEdit={() => openEditor("experience")} onAdd={() => openAddEditor("experience")} addLabel="Add">
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

                <SectionCard title="Education" onEdit={() => openEditor("education")} onAdd={() => openAddEditor("education")} addLabel="Add">
                  {profile.education.map((item) => (
                    <div key={`${item.degree}-${item.institution}`}>
                      <h4 className="text-sm font-black text-text-main dark:text-white">{item.degree}</h4>
                      <p className="type-body">{item.institution}</p>
                      <p className="text-xs text-text-muted">{item.year}</p>
                    </div>
                  ))}
                </SectionCard>

                <SectionCard title="Certifications" onEdit={() => openEditor("certifications")} onAdd={() => openAddEditor("certifications")} addLabel="Add">
                  {profile.certifications.map((item) => (
                    <div key={`${item.name}-${item.organization}`}>
                      <h4 className="text-sm font-black text-text-main dark:text-white">{item.name}</h4>
                      <p className="type-body">{item.organization}</p>
                      <p className="text-xs text-text-muted">{item.year}</p>
                    </div>
                  ))}
                </SectionCard>

                <SectionCard title="Availability" onEdit={() => openEditor("availability")}>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className="rounded-lg bg-success/10 p-4 dark:bg-success/10">
                      <p className="type-label">Immediate Availability</p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-black text-success">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-xs text-white">✓</span>
                        {profile.availability.immediate ? "Available immediately" : "Notice required"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/8 p-4 dark:bg-white/5">
                      <p className="type-label">Notice Period</p>
                      <p className="mt-2 text-sm font-bold text-text-main dark:text-white">
                        {profile.availability.immediate ? "Not required" : `${profile.availability.noticePeriod || "Not set"} ${profile.availability.noticePeriod ? profile.availability.noticeUnit : ""}`}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/8 p-4 dark:bg-white/5">
                      <p className="type-label">Preferred Job Location</p>
                      <p className="mt-2 text-sm font-bold text-text-main dark:text-white">{profile.preferredJobLocation || "Not set"}</p>
                    </div>
                  </div>
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

        {selectedActivity ? (
          <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/25 p-4 backdrop-blur-sm" onMouseDown={() => setSelectedActivity(null)}>
            <Card className="w-full max-w-lg p-6 shadow-hover" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="primary">Activity status</Badge>
                  <h3 className="mt-3 text-xl font-black text-text-main dark:text-white">{selectedActivity.title}</h3>
                  <p className="mt-1 text-sm font-bold text-success">{selectedActivity.status}</p>
                </div>
                <button type="button" onClick={() => setSelectedActivity(null)} className="rounded-full p-2 text-text-muted transition hover:bg-primary/10 hover:text-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-muted dark:text-slate-300">{selectedActivity.description}</p>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setSelectedActivity(null)} className="rounded-xl">Close</Button>
                <Button
                  type="button"
                  onClick={() => {
                    selectedActivity.action();
                    setSelectedActivity(null);
                  }}
                  className="rounded-xl"
                >
                  {selectedActivity.actionLabel}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {matchPanelOpen ? (
          <div className="fixed inset-0 z-[75] grid place-items-center bg-slate-950/25 p-4 backdrop-blur-sm" onMouseDown={() => setMatchPanelOpen(false)}>
            <Card className="max-h-[86vh] w-full max-w-3xl overflow-hidden p-0 shadow-hover" onMouseDown={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-border p-5 dark:border-white/10">
                <div>
                  <Badge variant="primary">AI matched jobs</Badge>
                  <h3 className="mt-3 text-2xl font-black text-text-main dark:text-white">Best-fit roles above 70%</h3>
                  <p className="mt-1 text-sm text-text-muted dark:text-slate-300">Review your strongest matches without leaving the dashboard.</p>
                </div>
                <button type="button" onClick={() => setMatchPanelOpen(false)} className="rounded-full p-2 text-text-muted transition hover:bg-primary/10 hover:text-primary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[58vh] space-y-3 overflow-y-auto p-5">
                {floatingMatches.length ? floatingMatches.map(({ job, match }) => (
                  <div key={job.id} className="rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30 hover:shadow-soft dark:border-white/10 dark:bg-surface-dark">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-text-main dark:text-white">{job.title}</h4>
                        <p className="mt-1 text-sm font-semibold text-text-muted">{job.company} - {job.location}</p>
                      </div>
                      <Badge variant="match-score" className="w-fit">{match.score}% match</Badge>
                    </div>
                    <p className="mt-3 rounded-xl bg-primary/8 px-3 py-2 text-xs font-semibold text-text-muted dark:bg-white/5 dark:text-slate-300">
                      {match.matchedSkills.length}/{job.skills.length} required skills matched.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.skills.slice(0, 5).map((skill) => (
                        <Badge key={skill} variant={match.matchedSkills.includes(skill) ? "success" : "neutral"}>{skill}</Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <LinkButton href={`/jobs?job=${job.id}`} className="rounded-xl px-4 py-2" onClick={() => setMatchPanelOpen(false)}>View job</LinkButton>
                      <Button type="button" variant="secondary" onClick={() => { setActiveTab("jobs"); setMatchPanelOpen(false); }} className="rounded-xl px-4 py-2">Open jobs tab</Button>
                    </div>
                  </div>
                )) : (
                  <EmptyState
                    icon={<Sparkles size={22} />}
                    title="No 70%+ matches yet"
                    message="Add more profile skills or broaden your preferred job location to unlock stronger recommendations."
                    actionLabel="Improve profile"
                    onAction={() => { setActiveTab("profile"); setMatchPanelOpen(false); }}
                  />
                )}
              </div>
            </Card>
          </div>
        ) : null}
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
                  <Input value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Current location" />
                  <select
                    value={draft.preferredJobLocation}
                    onChange={(event) => setDraft((current) => ({ ...current, preferredJobLocation: event.target.value }))}
                    className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white"
                  >
                    <option value="">Preferred job location</option>
                    {jobLocationOptions.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
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
                <div className="grid gap-4">
                  {draft.experience.map((item, index) => (
                    <Card key={`experience-draft-${index}`} className="p-4 shadow-none">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Badge variant="neutral">Experience {index + 1}</Badge>
                        {draft.experience.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setDraft((current) => ({
                              ...current,
                              experience: current.experience.filter((_, itemIndex) => itemIndex !== index)
                            }))}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3">
                        <Input value={item.role} onChange={(event) => setDraft((current) => ({ ...current, experience: current.experience.map((entry, entryIndex) => entryIndex === index ? { ...entry, role: event.target.value } : entry) }))} placeholder="Role" />
                        <Input value={item.company} onChange={(event) => setDraft((current) => ({ ...current, experience: current.experience.map((entry, entryIndex) => entryIndex === index ? { ...entry, company: event.target.value } : entry) }))} placeholder="Company" />
                        <Input value={item.period} onChange={(event) => setDraft((current) => ({ ...current, experience: current.experience.map((entry, entryIndex) => entryIndex === index ? { ...entry, period: event.target.value } : entry) }))} placeholder="Period" />
                        <TextArea value={item.description} onChange={(event) => setDraft((current) => ({ ...current, experience: current.experience.map((entry, entryIndex) => entryIndex === index ? { ...entry, description: event.target.value } : entry) }))} placeholder="Description" />
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => setDraft((current) => ({ ...current, experience: [...current.experience, createEmptyExperience()] }))} className="w-fit rounded-full px-3 py-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add another experience
                  </Button>
                </div>
              ) : null}

              {editing === "education" ? (
                <div className="grid gap-4">
                  {draft.education.map((item, index) => (
                    <Card key={`education-draft-${index}`} className="p-4 shadow-none">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Badge variant="neutral">Education {index + 1}</Badge>
                        {draft.education.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setDraft((current) => ({
                              ...current,
                              education: current.education.filter((_, itemIndex) => itemIndex !== index)
                            }))}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3">
                        <Input value={item.degree} onChange={(event) => setDraft((current) => ({ ...current, education: current.education.map((entry, entryIndex) => entryIndex === index ? { ...entry, degree: event.target.value } : entry) }))} placeholder="Degree" />
                        <Input value={item.institution} onChange={(event) => setDraft((current) => ({ ...current, education: current.education.map((entry, entryIndex) => entryIndex === index ? { ...entry, institution: event.target.value } : entry) }))} placeholder="Institution" />
                        <Input value={item.year} onChange={(event) => setDraft((current) => ({ ...current, education: current.education.map((entry, entryIndex) => entryIndex === index ? { ...entry, year: event.target.value } : entry) }))} placeholder="Year" />
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => setDraft((current) => ({ ...current, education: [...current.education, createEmptyEducation()] }))} className="w-fit rounded-full px-3 py-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add another education
                  </Button>
                </div>
              ) : null}

              {editing === "certifications" ? (
                <div className="grid gap-4">
                  {draft.certifications.map((item, index) => (
                    <Card key={`certification-draft-${index}`} className="p-4 shadow-none">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <Badge variant="neutral">Certification {index + 1}</Badge>
                        {draft.certifications.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setDraft((current) => ({
                              ...current,
                              certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index)
                            }))}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-3">
                        <Input value={item.name} onChange={(event) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry, entryIndex) => entryIndex === index ? { ...entry, name: event.target.value } : entry) }))} placeholder="Certificate name" />
                        <Input value={item.organization} onChange={(event) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry, entryIndex) => entryIndex === index ? { ...entry, organization: event.target.value } : entry) }))} placeholder="Organization" />
                        <Input value={item.year} onChange={(event) => setDraft((current) => ({ ...current, certifications: current.certifications.map((entry, entryIndex) => entryIndex === index ? { ...entry, year: event.target.value } : entry) }))} placeholder="Year" />
                      </div>
                    </Card>
                  ))}
                  <Button type="button" variant="secondary" onClick={() => setDraft((current) => ({ ...current, certifications: [...current.certifications, createEmptyCertification()] }))} className="w-fit rounded-full px-3 py-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Add another certification
                  </Button>
                </div>
              ) : null}

              {editing === "salary" ? (
                <div className="grid gap-3">
                  <Input value={draft.salary.current} onChange={(event) => setDraft((current) => ({ ...current, salary: { ...current.salary, current: event.target.value } }))} placeholder="Current salary" />
                  <Input value={draft.salary.expected} onChange={(event) => setDraft((current) => ({ ...current, salary: { ...current.salary, expected: event.target.value } }))} placeholder="Expected salary" />
                </div>
              ) : null}

              {editing === "availability" ? (
                <div className="grid gap-4">
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-bg p-4 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <input
                      type="checkbox"
                      checked={draft.availability.immediate}
                      onChange={(event) => setDraft((current) => ({
                        ...current,
                        availability: {
                          ...current.availability,
                          immediate: event.target.checked
                        }
                      }))}
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>
                      Immediate availability
                      <span className="mt-1 block text-xs font-semibold text-text-muted dark:text-slate-300">Tick this if you can join immediately.</span>
                    </span>
                  </label>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-text-muted">Preferred job location</label>
                    <select
                      value={draft.preferredJobLocation}
                      onChange={(event) => setDraft((current) => ({ ...current, preferredJobLocation: event.target.value }))}
                      className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white"
                    >
                      <option value="">Select preferred job location</option>
                      {jobLocationOptions.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>

                  {!draft.availability.immediate ? (
                    <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                      <Input
                        type="number"
                        min="1"
                        value={draft.availability.noticePeriod}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          availability: { ...current.availability, noticePeriod: event.target.value }
                        }))}
                        placeholder="Notice period"
                      />
                      <select
                        value={draft.availability.noticeUnit}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          availability: { ...current.availability, noticeUnit: event.target.value === "Months" ? "Months" : "Days" }
                        }))}
                        className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white"
                      >
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  ) : null}
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










