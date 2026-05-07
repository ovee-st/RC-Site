import type { Job } from "@/types";

export function mapSupabaseJob(row: any): Job {
  const skills = Array.isArray(row.required_skills_array)
    ? row.required_skills_array
    : Array.isArray(row.required_skills)
      ? row.required_skills
      : String(row.required_skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  return {
    id: row.id,
    title: row.job_title || row.title || "Untitled job",
    company: row.company_name || "Company",
    location: row.job_location || row.location || "Bangladesh",
    category: row.category || "Others",
    experience: row.experience_level || row.job_level || "Any Level",
    experienceYears: row.experience_years || "",
    jobType: row.job_type || row.employment_type || "Full Time",
    workType: row.work_type || row.job_type || "On-site",
    salaryMin: Number(row.salary_min || 0),
    salaryMax: Number(row.salary_max || 0),
    hideSalary: Boolean(row.hide_salary || row.salary_hidden),
    deadline: row.last_date || row.deadline || "",
    bannerUrl: row.banner_url || null,
    employerPhotoUrl: row.employer_photo_url || row.photo_url || row.company_logo_url || null,
    status: row.status || "active",
    skills,
    description: row.description || "Job description will be shared by the employer.",
    requirements: row.requirements || "Requirements will be shared by the employer.",
    createdAt: row.created_at
  };
}
