import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { InterviewAnswerFeedback, InterviewPreparationDto, InterviewQuestion } from "@/types/interviewPreparation";

export async function requireCandidate(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw Object.assign(new Error("Missing session token."), { status: 401 });

  const client = createServerSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) throw Object.assign(new Error("Invalid session."), { status: 401 });

  const { data: profile } = await client.from("profiles").select("*").eq("id", authData.user.id).maybeSingle();
  const role = String(profile?.role || authData.user.user_metadata?.role || "candidate").toLowerCase();
  if (role !== "candidate") throw Object.assign(new Error("Only candidates can use interview preparation."), { status: 403 });

  return { client, user: authData.user, profile: profile || {} };
}

export function isCandidatePro(profile: Record<string, any>, metadata: Record<string, any> = {}) {
  return String(profile.plan || metadata.plan || "Basic").trim().toLowerCase() === "pro";
}

export function interviewSetupError(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as any)?.message || error || "");
  if (/interview_preparation_|schema cache|PGRST205|does not exist|Could not find/i.test(message)) {
    return "Interview preparation storage is not configured. Run supabase-interview-preparation.sql in Supabase and reload the API schema cache.";
  }
  return message || "Could not load interview preparation.";
}

function mapAnswer(row: Record<string, any>): InterviewAnswerFeedback {
  return {
    id: String(row.id),
    questionId: String(row.question_id),
    answer: String(row.answer || ""),
    score: row.ai_score == null ? null : Number(row.ai_score),
    feedback: row.feedback ? String(row.feedback) : null,
    strengths: Array.isArray(row.strengths) ? row.strengths.map(String) : [],
    improvements: Array.isArray(row.improvements) ? row.improvements.map(String) : [],
    createdAt: String(row.created_at || new Date().toISOString())
  };
}

export async function mapPreparationSession(client: SupabaseClient, row: Record<string, any>, job?: Record<string, any> | null): Promise<InterviewPreparationDto> {
  let jobRow = job;
  if (!jobRow) {
    const result = await client.from("jobs").select("id, job_title, company_name").eq("id", row.job_id).maybeSingle();
    jobRow = result.data;
  }
  const { data: responseRows } = await client.from("interview_preparation_responses").select("*").eq("session_id", row.id).order("created_at", { ascending: true });

  return {
    id: String(row.id),
    jobId: String(row.job_id),
    applicationId: row.application_id ? String(row.application_id) : null,
    jobTitle: String(jobRow?.job_title || "Interview preparation"),
    companyName: String(jobRow?.company_name || "Employer"),
    mode: row.mode === "mock" ? "mock" : "basic",
    status: row.status === "completed" ? "completed" : "in_progress",
    isPro: Boolean(row.is_pro),
    questionLimit: row.question_limit == null ? null : Number(row.question_limit),
    readinessScore: Number(row.readiness_score || 0),
    strengths: Array.isArray(row.strengths) ? row.strengths.map(String) : [],
    missingSkills: Array.isArray(row.missing_skills) ? row.missing_skills.map(String) : [],
    improvementAreas: Array.isArray(row.improvement_areas) ? row.improvement_areas.map(String) : [],
    questions: Array.isArray(row.questions) ? row.questions as InterviewQuestion[] : [],
    answers: (responseRows || []).map(mapAnswer),
    currentQuestion: Number(row.current_question || 0),
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || row.created_at || new Date().toISOString())
  };
}
