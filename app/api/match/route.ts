import { NextRequest, NextResponse } from "next/server";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { Candidate, Job } from "@/types";

function mapJob(row: any): Job {
  return {
    id: row.id,
    title: row.job_title || row.title || "Open Role",
    company: row.company_name || "MX Partner Employer",
    location: row.job_location || "Bangladesh",
    category: row.category || "Others",
    experience: row.job_level || row.experience_level || "Any Level",
    jobType: row.employment_type || row.job_type || "Full Time",
    salaryMin: Number(row.salary_min || 0),
    salaryMax: Number(row.salary_max || 0),
    skills: Array.isArray(row.required_skills_array) ? row.required_skills_array : String(row.required_skills || "").split(",").map((item) => item.trim()).filter(Boolean),
    description: row.description || "",
    requirements: row.requirements || "",
    embedding: row.embedding || undefined
  };
}

function mapCandidate(row: any): Candidate {
  return {
    id: row.user_id || row.id,
    name: row.full_name || "Candidate",
    title: row.career_level || "Candidate",
    avatar: row.photo_url || undefined,
    category: row.category || "Others",
    experience: row.career_level || "Any Level",
    skills: Array.isArray(row.skills_array) ? row.skills_array : String(row.skills || "").split(",").map((item) => item.trim()).filter(Boolean),
    profile: [row.about, row.experience].filter(Boolean).join(" "),
    embedding: row.embedding || undefined
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const candidateId = searchParams.get("candidateId");
  if (!jobId || !candidateId) return NextResponse.json({ error: "jobId and candidateId are required." }, { status: 400 });

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServerSupabaseClient();
      const [{ data: job }, { data: candidate }] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", jobId).single(),
        supabase.from("candidates").select("*").or(`id.eq.${candidateId},user_id.eq.${candidateId}`).single()
      ]);
      if (job && candidate) return NextResponse.json(matchCandidateToJob(mapCandidate(candidate), mapJob(job)));
    }
  } catch {
    // Demo fallback keeps local development working without credentials.
  }

  const job = demoJobs.find((item) => item.id === jobId) || demoJobs[0];
  const candidate = demoCandidates.find((item) => item.id === candidateId) || demoCandidates[0];
  return NextResponse.json(matchCandidateToJob(candidate, job));
}
