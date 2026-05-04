"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Camera, FileText, Pencil, Save, Sparkles, UserRound, X } from "lucide-react";
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

type CandidateTab = "profile" | "jobs" | "applied" | "resume";
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
  { id: "jobs", label: "Available Jobs", icon: BriefcaseBusiness },
  { id: "applied", label: "Applied Jobs", icon: Sparkles },
  { id: "resume", label: "Resume Builder", icon: FileText }
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
  const avatar = user?.avatar || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || candidate.avatar || null;

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

export default function CandidateDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialTab = (searchParams.get("tab") as CandidateTab | null) || (searchParams.get("view") === "profile" ? "profile" : "profile");
  const [activeTab, setActiveTab] = useState<CandidateTab>(navItems.some((item) => item.id === initialTab) ? initialTab : "profile");
  const [profile, setProfile] = useState<CandidateProfileState>(() => loadSavedProfile(user));
  const [editing, setEditing] = useState<EditableSection>(null);
  const [draft, setDraft] = useState<CandidateProfileState>(() => loadSavedProfile(user));
  const candidate = demoCandidates[0];
  const matchedJobs = useMemo(
    () => demoJobs.map((job) => ({ job, match: matchCandidateToJob(candidate, job) })).sort((a, b) => b.match.score - a.match.score),
    [candidate]
  );

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
        role: "candidate"
      }
    }));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  };

  const openEditor = (section: EditableSection) => {
    setDraft(profile);
    setEditing(section);
  };

  const closeEditor = () => {
    setDraft(profile);
    setEditing(null);
  };

  const saveEditor = () => {
    persistProfile(draft);
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
                <p className="type-body mt-2">Generate ATS and designed CV versions from your profile data.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <LinkButton href="#" className="rounded-lg">Download ATS CV</LinkButton>
                  <LinkButton href="#" variant="secondary" className="rounded-lg">Download Designed CV</LinkButton>
                </div>
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
