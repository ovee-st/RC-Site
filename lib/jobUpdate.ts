export function normalizeDateValue(value?: string | null) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : "";
}

export type NormalizedJobStatus = "active" | "archived" | "hired";

export function normalizeJobStatus(status?: string | null): NormalizedJobStatus {
  const value = String(status || "active").toLowerCase();
  if (value === "inactive" || value === "archive" || value === "archived") return "archived";
  if (value === "hired") return "hired";
  return "active";
}

export function normalizeJobPatch(input: Record<string, any>) {
  const patch: Record<string, any> = {};

  const mappings: Record<string, string> = {
    title: "job_title",
    company: "company_name",
    location: "job_location",
    experience: "job_level",
    jobType: "job_type",
    workType: "work_type",
    salaryMin: "salary_min",
    salaryMax: "salary_max",
    hideSalary: "hide_salary",
    deadline: "last_date",
    skills: "required_skills"
  };

  Object.entries(input).forEach(([key, value]) => {
    const target = mappings[key] || key;
    if (value === undefined) return;
    patch[target] = value;
  });

  if ("status" in patch) {
    patch.status = normalizeJobStatus(patch.status);
  }

  if ("last_date" in patch) {
    patch.last_date = normalizeDateValue(patch.last_date) || null;
  }

  if ("salary_min" in patch) {
    patch.salary_min = Number(patch.salary_min) || 0;
  }

  if ("salary_max" in patch) {
    patch.salary_max = Number(patch.salary_max) || 0;
  }

  if (Array.isArray(patch.required_skills)) {
    patch.required_skills = Array.from(new Set(patch.required_skills.map((skill: string) => String(skill).trim()).filter(Boolean)));
  }

  return patch;
}
