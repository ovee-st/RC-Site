import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";
import { normalizeJobStatus } from "@/lib/jobUpdate";

function formatSalary(job: ReturnType<typeof mapSupabaseJob>) {
  if (job.hideSalary) return "Salary hidden";
  if (job.salaryMin && job.salaryMax) return `BDT ${Math.round(job.salaryMin / 1000)}k-${Math.round(job.salaryMax / 1000)}k`;
  if (job.salaryMin) return `BDT ${Math.round(job.salaryMin / 1000)}k+`;
  if (job.salaryMax) return `Up to BDT ${Math.round(job.salaryMax / 1000)}k`;
  return "Negotiable";
}

function toMobileJob(row: any) {
  const job = mapSupabaseJob(row);

  return {
    id: String(job.id),
    title: job.title,
    company: job.company,
    location: job.location,
    salary: formatSalary(job),
    deadline: job.deadline || "Open until filled",
    jobType: job.jobType || job.workType || "Full Time",
    experienceLevel: job.experience || "Any Level",
    industry: job.category || "General",
    skills: job.skills || [],
    matchScore: null,
    description: job.description || "Job description will be shared by the employer."
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = String(searchParams.get("search") || "").trim().toLowerCase();
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ data: [], error: error.message }, { status: 200 });
    }

    const now = new Date();
    const jobs = (data || [])
      .filter((row) => normalizeJobStatus(row.status) === "active")
      .filter((row) => {
        if (!row.last_date) return true;
        const deadline = new Date(`${row.last_date}T23:59:59`);
        return Number.isNaN(deadline.getTime()) || deadline >= now;
      })
      .map(toMobileJob)
      .filter((job) => {
        if (!search) return true;
        const haystack = [job.title, job.company, job.location, job.industry, job.jobType, job.experienceLevel, ...job.skills]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });

    return NextResponse.json({ data: jobs, error: null });
  } catch (error: any) {
    return NextResponse.json({ data: [], error: error?.message || "Could not load jobs." }, { status: 200 });
  }
}
