import { describe, expect, it } from "vitest";
import { normalizeJobPatch } from "@/lib/jobUpdate";

describe("normalizeJobPatch", () => {
  it("maps the complete employer job editor payload to the jobs schema", () => {
    expect(normalizeJobPatch({
      company: "MX Venture Lab",
      title: "Product Designer",
      location: "Remote",
      category: "Design/Creative",
      experience: "Senior Level",
      experienceYears: "5",
      jobType: "Full Time",
      workType: "Remote",
      salaryMin: "80000",
      salaryMax: "120000",
      hideSalary: true,
      deadline: "2026-08-31",
      status: "active",
      skills: ["Figma", "Research", "Figma"],
      description: "Lead product design.",
      requirements: "Five years of experience."
    })).toEqual({
      company_name: "MX Venture Lab",
      job_title: "Product Designer",
      job_location: "Remote",
      category: "Design/Creative",
      job_level: "Senior Level",
      experience_level: "5",
      employment_type: "Full Time",
      job_type: "Remote",
      salary_min: 80000,
      salary_max: 120000,
      salary_hidden: true,
      last_date: "2026-08-31",
      status: "active",
      required_skills_array: ["Figma", "Research"],
      required_skills: "Figma, Research",
      description: "Lead product design.",
      requirements: "Five years of experience."
    });
  });
});
