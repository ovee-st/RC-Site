import { NextResponse } from "next/server";
import { normalizeDateValue } from "@/lib/jobUpdate";
import { mapSupabaseJob } from "@/lib/mapSupabaseJob";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SubscriptionService } from "@/lib/subscriptionService";
import { validateJobCreationPolicy } from "@/lib/jobSubscriptionPolicy";
import { generateJobEnrichment } from "@/lib/seoGenerator";

const JOB_CREATOR_ROLES = new Set(["employer", "admin"]);

async function buildJobInsert(body: Record<string, any>, employerUserId: string) {
  const skills = Array.isArray(body.skills)
    ? body.skills.map((skill) => String(skill).trim()).filter(Boolean)
    : String(body.required_skills || body.skills || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

  const payload = {
    employer_id: employerUserId,
    company_name: String(body.company || body.company_name || "MX Partner Employer").trim(),
    job_title: String(body.title || body.job_title || "").trim(),
    job_location: String(body.location || body.job_location || "").trim(),
    category: String(body.category || "Others").trim(),
    job_level: String(body.experience || body.job_level || body.experience_level || "Any Level").trim(),
    experience_level: String(body.experience || body.experience_level || body.job_level || "Any Level").trim(),
    job_type: String(body.workType || body.work_type || body.job_type || "On-site").trim(),
    employment_type: String(body.jobType || body.employment_type || "Full Time").trim(),
    salary_min: Number(body.salaryMin ?? body.salary_min) || 0,
    salary_max: Number(body.salaryMax ?? body.salary_max) || 0,
    salary_range: body.hideSalary || body.salary_hidden
      ? "Hidden"
      : `${Number(body.salaryMin ?? body.salary_min) || 0}-${Number(body.salaryMax ?? body.salary_max) || 0}`,
    salary_hidden: Boolean(body.hideSalary ?? body.salary_hidden),
    required_skills: skills.join(", "),
    required_skills_array: skills,
    description: String(body.description || "").trim(),
    requirements: String(body.requirements || "Requirements will be shared during screening.").trim(),
    last_date: normalizeDateValue(body.deadline || body.last_date) || null,
    status: "active"
  };

  const enrichment = await generateJobEnrichment({
    title: payload.job_title,
    company: payload.company_name,
    location: payload.job_location,
    category: payload.category,
    employmentType: payload.employment_type,
    experience: payload.experience_level,
    description: payload.description,
    requirements: payload.requirements,
    skills
  });

  return {
    ...payload,
    ...enrichment
  };
}

function missingColumnFromError(message?: string) {
  return (
    message?.match(/Could not find the '([^']+)' column/i)?.[1] ||
    message?.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    null
  );
}

async function insertJobWithSeoFallback(
  client: ReturnType<typeof createServerSupabaseClient>,
  originalPayload: Awaited<ReturnType<typeof buildJobInsert>>
) {
  let payload: Record<string, unknown> = originalPayload;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const { data, error } = await client.from("jobs").insert(payload).select("*").single();
    if (!error) return { data, error: null };

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn || !(missingColumn in payload) || !missingColumn.startsWith("seo_") && !missingColumn.startsWith("ai_")) {
      return { data: null, error };
    }

    const { [missingColumn]: _removed, ...compatiblePayload } = payload;
    payload = compatiblePayload;
  }

  return { data: null, error: { message: "Could not store the generated job SEO fields." } };
}

function validateJobPayload(payload: Awaited<ReturnType<typeof buildJobInsert>>) {
  if (!payload.job_title || !payload.job_location || !payload.description || !payload.last_date) {
    return "Job title, location, description, and application deadline are required.";
  }

  return null;
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing session token.", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid session.", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const role = String(profile?.role || authData.user.user_metadata?.role || "");

  if (!JOB_CREATOR_ROLES.has(role)) {
    return NextResponse.json({ error: "Only employers can create job posts.", code: "FORBIDDEN_ROLE" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const payload = await buildJobInsert(body, authData.user.id);
  const payloadError = validateJobPayload(payload);

  if (payloadError) {
    return NextResponse.json({ error: payloadError, code: "INVALID_JOB_PAYLOAD" }, { status: 400 });
  }

  const subscriptionService = new SubscriptionService(adminClient);
  const policy = await validateJobCreationPolicy(adminClient, subscriptionService, authData.user.id);

  if (!policy.allowed) {
    return NextResponse.json(policy.body, { status: policy.status });
  }

  const { data: job, error: insertError } = await insertJobWithSeoFallback(adminClient, payload);

  if (insertError) {
    return NextResponse.json({ error: insertError.message || "Could not publish job.", code: "JOB_CREATE_FAILED" }, { status: 400 });
  }

  const tracking = await subscriptionService.recordJobPost(policy.employer.id);

  return NextResponse.json({
    job: mapSupabaseJob(job),
    saved: true,
    subscription: {
      usage: tracking.usage,
      access: tracking.access,
      recorded: tracking.recorded
    }
  });
}
