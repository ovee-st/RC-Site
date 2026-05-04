"use client";

import { useState } from "react";
import { BriefcaseBusiness, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Job } from "@/types";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useJobStore } from "@/store/useJobStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { bdjobsDepartments } from "@/lib/bdjobsDepartments";
import SkillPicker from "@/components/skills/SkillPicker";

const defaultJob = {
  title: "",
  company: "MX Partner Employer",
  location: "Dhaka, Bangladesh",
  category: "HR/Org. Development",
  experience: "Mid Level",
  experienceYears: "2",
  jobType: "Full Time",
  workType: "On-site",
  salaryMin: "30000",
  salaryMax: "50000",
  hideSalary: false,
  deadline: "",
  skills: "Admin, Excel, Coordination",
  description: "",
  requirements: ""
};

const sampleJds: Record<string, { title: string; skills: string; description: string; requirements: string }> = {
  "General Management/Admin": {
    title: "Admin & Operations Manager",
    skills: "Admin, Excel, Coordination, Documentation, Scheduling",
    description: "Lead daily administrative operations, coordinate internal teams, maintain documentation, and support smooth office execution across departments.\n\nResponsibilities:\n- Manage day-to-day admin operations\n- Coordinate vendors, facilities, and reporting\n- Maintain organized documentation and schedules",
    requirements: "Requirements:\n- Strong Excel and documentation skills\n- 2+ years of admin or operations experience\n- Clear communication and coordination ability"
  },
  "HR/Org. Development": {
    title: "HR & Admin Executive",
    skills: "HR Operations, Recruitment, Documentation, Excel, Communication",
    description: "Support HR operations, recruitment coordination, onboarding, employee documentation, and administrative reporting for a growing team.\n\nResponsibilities:\n- Coordinate interviews and onboarding\n- Maintain HR files and reports\n- Support attendance, leave, and employee records",
    requirements: "Requirements:\n- HR/admin experience preferred\n- Strong communication and Excel skills\n- Ability to handle confidential employee information"
  },
  "IT/Telecommunication": {
    title: "Software Engineer",
    skills: "JavaScript, React, API, Database, Git",
    description: "Build, maintain, and improve digital products with clean code, responsive interfaces, and reliable integrations.\n\nResponsibilities:\n- Develop production-ready features\n- Integrate APIs and backend services\n- Collaborate with product and operations teams",
    requirements: "Requirements:\n- Strong JavaScript and frontend/backend fundamentals\n- Experience with APIs and databases\n- Portfolio or previous project experience preferred"
  },
  "Customer Service/Call Centre": {
    title: "Customer Support Executive",
    skills: "Communication, CRM, Typing, Problem Solving, Customer Handling",
    description: "Handle customer conversations professionally, document issues, and coordinate timely resolutions with internal teams.\n\nResponsibilities:\n- Respond to customer queries\n- Log cases in CRM or tracking tools\n- Escalate and follow up on unresolved issues",
    requirements: "Requirements:\n- Clear communication and active listening\n- Typing and CRM knowledge preferred\n- Customer-first mindset"
  }
};

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "focus-ring min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main placeholder:text-text-muted shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white",
        className
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export default function EmployerPostJob({ label = "Post New Job" }: { label?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addJob } = useJobStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultJob);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const updateForm = (key: keyof typeof defaultJob, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectedSkills = form.skills.split(",").map((skill) => skill.trim()).filter(Boolean);

  const applySampleJD = () => {
    const sample = sampleJds[form.category] || sampleJds["General Management/Admin"];
    setForm((current) => ({
      ...current,
      title: current.title || sample.title,
      skills: sample.skills,
      description: sample.description,
      requirements: sample.requirements
    }));
  };

  const insertFormatting = (field: "description" | "requirements", snippet: string) => {
    setForm((current) => ({
      ...current,
      [field]: `${current[field].trim()}${current[field].trim() ? "\n\n" : ""}${snippet}`
    }));
  };

  const loadEmployerBanner = () => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("mx_employer_profile");
      return saved ? (JSON.parse(saved).banner_url || null) : null;
    } catch {
      return null;
    }
  };

  const submitJob = async () => {
    setMessage("");

    if (!form.title.trim() || !form.location.trim() || !form.description.trim() || !form.deadline.trim()) {
      setMessage("Job title, location, description, and application deadline are required.");
      return;
    }

    const job: Job = {
      id: `job-${Date.now()}`,
      title: form.title.trim(),
      company: form.company.trim() || "MX Partner Employer",
      location: form.location.trim(),
      category: form.category,
      experience: form.experience,
      experienceYears: form.experienceYears,
      jobType: form.jobType,
      workType: form.workType,
      salaryMin: Number(form.salaryMin) || 0,
      salaryMax: Number(form.salaryMax) || 0,
      hideSalary: form.hideSalary,
      deadline: form.deadline,
      bannerUrl: loadEmployerBanner(),
      status: "active",
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      description: form.description.trim(),
      requirements: form.requirements.trim() || "Requirements will be shared during screening.",
      createdAt: new Date().toISOString()
    };

    setSaving(true);
    addJob(job);

    if (user?.id && isSupabaseConfigured) {
      try {
        await supabase
          .from("jobs")
          .insert({
            employer_id: user.id,
            company_name: job.company,
            job_title: job.title,
            job_location: job.location,
            category: job.category,
            experience_level: job.experience,
            job_type: job.jobType,
            salary_min: job.salaryMin,
            salary_max: job.salaryMax,
            required_skills: job.skills,
            description: job.description,
            requirements: job.requirements,
            experience_years: job.experienceYears,
            work_type: job.workType,
            hide_salary: job.hideSalary,
            last_date: job.deadline,
            banner_url: job.bannerUrl,
            status: "active"
          })
          .throwOnError();
      } catch {
        setMessage("Job saved locally. Supabase jobs table may need the latest columns.");
      }
    }

    setSaving(false);
    setMessage("Job published successfully.");
    window.setTimeout(() => {
      setOpen(false);
      setForm(defaultJob);
      router.push("/jobs");
    }, 900);
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {label}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close post job form" onClick={() => setOpen(false)} />
          <Card className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto p-6 shadow-elevated">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="primary" className="type-label text-primary">Post Job</Badge>
                  <h2 className="type-h2 mt-2">Publish a hiring requirement</h2>
                  <p className="type-body mt-1">Create a role and make it visible on the jobs page.</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-text-muted transition hover:bg-primary/5 hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input value={form.company} onChange={(event) => updateForm("company", event.target.value)} placeholder="Company Name" />
              <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Designation / Job Title" />
              <Input value={form.location} onChange={(event) => updateForm("location", event.target.value)} placeholder="Job Location" />
              <select value={form.jobType} onChange={(event) => updateForm("jobType", event.target.value)} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Intern</option>
              </select>
              <select value={form.workType} onChange={(event) => updateForm("workType", event.target.value)} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
              <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                {bdjobsDepartments.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
              <select value={form.experience} onChange={(event) => updateForm("experience", event.target.value)} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <option>Entry Level</option>
                <option>Mid Level</option>
                <option>Senior Level</option>
              </select>
              <Input value={form.experienceYears} onChange={(event) => updateForm("experienceYears", event.target.value)} placeholder="Required Experience (years)" type="number" min="0" />
              <Input value={form.salaryMin} onChange={(event) => updateForm("salaryMin", event.target.value)} placeholder="Min Salary" type="number" />
              <Input value={form.salaryMax} onChange={(event) => updateForm("salaryMax", event.target.value)} placeholder="Max Salary" type="number" />
              <label className="flex min-h-[46px] items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-bold text-text-main shadow-soft dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <input
                  type="checkbox"
                  checked={form.hideSalary}
                  onChange={(event) => updateForm("hideSalary", event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Hide salary from public job post
              </label>
              <Input value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} placeholder="Application Deadline" type="date" />
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="type-label">Required Skills</p>
                  <p className="text-xs font-semibold text-text-muted dark:text-slate-300">{selectedSkills.length} selected</p>
                </div>
                <SkillPicker
                  compact
                  selectedSkills={selectedSkills}
                  onChange={(skills) => updateForm("skills", skills.join(", "))}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                <Button type="button" variant="secondary" onClick={applySampleJD} className="rounded-xl px-4 py-2">
                  Use Sample JD
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => insertFormatting("description", "Responsibilities:\n- \n- \n- ")} className="rounded-xl px-3 py-2">Add responsibilities</Button>
                  <Button type="button" variant="ghost" onClick={() => insertFormatting("requirements", "Requirements:\n- \n- \n- ")} className="rounded-xl px-3 py-2">Add bullets</Button>
                </div>
              </div>
              <TextArea className="md:col-span-2" value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Job description" />
              <TextArea className="md:col-span-2" value={form.requirements} onChange={(event) => updateForm("requirements", event.target.value)} placeholder="Requirements" />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {message ? <p className="text-sm font-semibold text-primary">{message}</p> : <span />}
              <Button type="button" onClick={submitJob} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Publishing..." : "Post Job"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
