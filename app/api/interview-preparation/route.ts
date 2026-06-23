import { NextResponse } from "next/server";
import { analyzeInterviewFit, generateFallbackInterviewQuestions, normalizeSkillList } from "@/lib/interviewPreparation";
import { getDemoInterviewJob, interviewSetupError, isCandidatePro, isUuid, mapPreparationSession, requireCandidate } from "@/lib/interviewPreparationServer";
import type { InterviewQuestion } from "@/types/interviewPreparation";

export const runtime = "nodejs";

function apiError(error: unknown) {
  const status = Number((error as any)?.status || 500);
  return NextResponse.json({ error: interviewSetupError(error) }, { status });
}

async function generateAiQuestions(job: Record<string, any>, limit: number) {
  const fallback = generateFallbackInterviewQuestions({
    title: String(job.job_title || "the role"),
    description: String(job.description || ""),
    requirements: String(job.requirements || ""),
    skills: normalizeSkillList(job.required_skills_array || job.required_skills)
  }, limit);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_INTERVIEW_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.45,
        max_tokens: 2200,
        messages: [
          { role: "system", content: "Create practical interview questions as JSON. Return {questions:[{id,type,question,focus,guidance}]}. Types must be technical, behavioral, or situational. Do not include answers." },
          { role: "user", content: JSON.stringify({ limit, jobTitle: job.job_title, description: job.description, requirements: job.requirements, skills: job.required_skills_array || job.required_skills }) }
        ]
      })
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const valid = questions.filter((question: InterviewQuestion) => question?.id && question?.question && ["technical", "behavioral", "situational"].includes(question.type));
    return valid.length >= Math.min(5, limit) ? valid.slice(0, limit) : fallback;
  } catch {
    return fallback;
  }
}

export async function GET(request: Request) {
  try {
    const { client, user } = await requireCandidate(request);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const jobId = searchParams.get("job_id");

    if (sessionId || jobId) {
      let query = client.from("interview_preparation_sessions").select("*").eq("candidate_user_id", user.id);
      query = sessionId ? query.eq("id", sessionId) : isUuid(jobId!) ? query.eq("job_id", jobId!) : query.eq("job_reference", jobId!);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return NextResponse.json({ preparation: data ? await mapPreparationSession(client, data) : null });
    }

    const [{ data: applicationRows, error: applicationError }, { data: sessionRows, error: sessionError }] = await Promise.all([
      client.from("applications").select("*").or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(100),
      client.from("interview_preparation_sessions").select("*").eq("candidate_user_id", user.id).order("created_at", { ascending: false }).limit(100)
    ]);
    if (applicationError) throw applicationError;
    if (sessionError) throw sessionError;

    const jobIds = Array.from(new Set((applicationRows || []).map((row) => row.job_id).filter(Boolean)));
    const { data: jobs, error: jobsError } = jobIds.length
      ? await client.from("jobs").select("id, job_title, company_name").in("id", jobIds)
      : { data: [], error: null };
    if (jobsError) throw jobsError;
    const jobsById = new Map((jobs || []).map((job) => [String(job.id), job]));
    const latestSessionByJob = new Map<string, Record<string, any>>();
    (sessionRows || []).forEach((session) => {
      const sessionJobId = String(session.job_reference || session.job_id);
      if (!latestSessionByJob.has(sessionJobId)) latestSessionByJob.set(sessionJobId, session);
    });

    const appliedJobs = (applicationRows || []).filter((application) => application.job_id && jobsById.has(String(application.job_id))).map((application) => {
      const job = jobsById.get(String(application.job_id))!;
      const session = latestSessionByJob.get(String(application.job_id));
      return {
        applicationId: String(application.id),
        jobId: String(application.job_id),
        jobTitle: String(job.job_title || application.job_role || "Applied role"),
        companyName: String(job.company_name || "Employer"),
        status: String(application.status || "Applied"),
        preparationId: session ? String(session.id) : null,
        readinessScore: session ? Number(session.readiness_score || 0) : null
      };
    });
    return NextResponse.json({ appliedJobs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client, user, profile } = await requireCandidate(request);
    const body = await request.json().catch(() => ({}));
    const jobId = String(body.job_id || body.jobId || "").trim();
    const requestedMode = body.mode === "mock" ? "mock" : "basic";
    if (!jobId) return NextResponse.json({ error: "A job is required for interview preparation." }, { status: 400 });

    const databaseJob = isUuid(jobId) ? await client.from("jobs").select("*").eq("id", jobId).maybeSingle() : { data: null, error: null };
    const job = databaseJob.data || getDemoInterviewJob(jobId);
    if (databaseJob.error) throw databaseJob.error;
    if (!job) return NextResponse.json({ error: "The selected job was not found." }, { status: 404 });

    const isPro = isCandidatePro(profile, user.user_metadata || {});
    if (requestedMode === "mock" && !isPro) {
      return NextResponse.json({ error: "AI Mock Interview is available with Candidate Pro." }, { status: 403 });
    }

    const { data: existingSession, error: existingError } = await client
      .from("interview_preparation_sessions")
      .select("*")
      .eq("candidate_user_id", user.id)
      .eq(isUuid(jobId) ? "job_id" : "job_reference", jobId)
      .eq("mode", requestedMode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingSession && (!isPro || !body.regenerate)) {
      return NextResponse.json({ preparation: await mapPreparationSession(client, existingSession, job), reused: true });
    }

    const [{ data: candidate }, applicationResult] = await Promise.all([
      client.from("candidates").select("*").or(`user_id.eq.${user.id},id.eq.${user.id}`).limit(1).maybeSingle(),
      isUuid(jobId)
        ? client.from("applications").select("id").or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`).eq("job_id", jobId).order("created_at", { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);
    const application = applicationResult.data;
    const candidateSkills = normalizeSkillList(candidate?.skills_array || candidate?.skills || candidate?.other_skills);
    const jobSkills = normalizeSkillList(job.required_skills_array || job.required_skills);
    const fit = analyzeInterviewFit({ skills: candidateSkills, title: candidate?.target_role || profile.full_name, about: candidate?.about, experience: candidate?.experience_json }, {
      title: String(job.job_title || "the role"), description: String(job.description || ""), requirements: String(job.requirements || ""), skills: jobSkills
    });
    const questionLimit = isPro ? 15 : 5;
    const questions = await generateAiQuestions(job, questionLimit);
    const now = new Date().toISOString();
    const { data: session, error: insertError } = await client.from("interview_preparation_sessions").insert({
      candidate_user_id: user.id,
      application_id: application?.id || null,
      job_id: isUuid(jobId) ? jobId : null,
      job_reference: jobId,
      mode: requestedMode,
      status: "in_progress",
      is_pro: isPro,
      question_limit: isPro ? null : 5,
      readiness_score: fit.readinessScore,
      strengths: fit.strengths,
      missing_skills: fit.missingSkills,
      improvement_areas: fit.improvementAreas,
      questions,
      report_data: { jobTitle: job.job_title, companyName: job.company_name, generatedAt: now },
      updated_at: now
    }).select("*").single();
    if (insertError) throw insertError;
    return NextResponse.json({ preparation: await mapPreparationSession(client, session, job) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
