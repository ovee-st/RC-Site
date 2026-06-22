import { NextResponse } from "next/server";
import { scoreInterviewAnswer } from "@/lib/interviewPreparation";
import { FREE_INTERVIEW_SUBMISSION_LIMIT, interviewSetupError, mapPreparationSession, requireCandidate } from "@/lib/interviewPreparationServer";
import type { InterviewQuestion } from "@/types/interviewPreparation";

export const runtime = "nodejs";

async function getAiFeedback(question: InterviewQuestion, answer: string) {
  const fallback = scoreInterviewAnswer(answer, question);
  if (!process.env.OPENAI_API_KEY) return fallback;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_INTERVIEW_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: "Evaluate an interview answer. Return JSON {score,technicalScore,behavioralScore,communicationScore,feedback,strengths:string[],weaknesses:string[],suggestedImprovement}. Scores are 0-100. Be specific, constructive, and concise." },
          { role: "user", content: JSON.stringify({ question: question.question, type: question.type, focus: question.focus, answer }) }
        ]
      })
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    const result = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    return {
      score: Math.max(0, Math.min(100, Number(result.score) || fallback.score)),
      technicalScore: Math.max(0, Math.min(100, Number(result.technicalScore) || fallback.technicalScore)),
      behavioralScore: Math.max(0, Math.min(100, Number(result.behavioralScore) || fallback.behavioralScore)),
      communicationScore: Math.max(0, Math.min(100, Number(result.communicationScore) || fallback.communicationScore)),
      feedback: String(result.feedback || fallback.feedback),
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String).slice(0, 4) : fallback.strengths,
      improvements: Array.isArray(result.weaknesses) ? result.weaknesses.map(String).slice(0, 4) : fallback.improvements,
      suggestedImprovement: String(result.suggestedImprovement || fallback.suggestedImprovement)
    };
  } catch {
    return fallback;
  }
}

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await context.params;
    const { client, user } = await requireCandidate(request);
    const body = await request.json().catch(() => ({}));
    const questionId = String(body.question_id || body.questionId || "").trim();
    const answer = String(body.answer || "").trim();
    const action = body.action === "draft" ? "draft" : "submit";
    const minimumLength = action === "draft" ? 1 : 20;
    if (!questionId || answer.length < minimumLength) {
      return NextResponse.json({ error: action === "draft" ? "Enter an answer before saving the draft." : "Provide an answer of at least 20 characters before submitting." }, { status: 400 });
    }

    const { data: session, error: sessionError } = await client.from("interview_preparation_sessions").select("*").eq("id", sessionId).eq("candidate_user_id", user.id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ error: "Interview preparation session was not found." }, { status: 404 });
    const questions = Array.isArray(session.questions) ? session.questions as InterviewQuestion[] : [];
    const question = questions.find((item) => item.id === questionId);
    if (!question) return NextResponse.json({ error: "Interview question was not found." }, { status: 404 });
    const now = new Date().toISOString();

    if (action === "draft") {
      const { error: draftError } = await client.from("interview_preparation_responses").upsert({
        session_id: sessionId,
        question_id: questionId,
        question: question.question,
        question_type: question.type,
        answer,
        submission_status: "draft",
        updated_at: now
      }, { onConflict: "session_id,question_id" });
      if (draftError) throw draftError;
      return NextResponse.json({ preparation: await mapPreparationSession(client, session), saved: "draft" });
    }

    const { data: existingResponses, error: existingError } = await client.from("interview_preparation_responses").select("question_id, submission_status").eq("session_id", sessionId);
    if (existingError) throw existingError;
    const submittedQuestionIds = new Set((existingResponses || []).filter((row) => row.submission_status === "submitted").map((row) => String(row.question_id)));
    if (!session.is_pro && !submittedQuestionIds.has(questionId) && submittedQuestionIds.size >= FREE_INTERVIEW_SUBMISSION_LIMIT) {
      return NextResponse.json({ error: `Free candidates can submit ${FREE_INTERVIEW_SUBMISSION_LIMIT} answers per interview. Upgrade to Candidate Pro for unlimited submissions and mock interviews.` }, { status: 429 });
    }

    const result = await getAiFeedback(question, answer);
    const { error: responseError } = await client.from("interview_preparation_responses").upsert({
      session_id: sessionId,
      question_id: questionId,
      question: question.question,
      question_type: question.type,
      answer,
      submission_status: "submitted",
      ai_score: result.score,
      technical_score: result.technicalScore,
      behavioral_score: result.behavioralScore,
      communication_score: result.communicationScore,
      feedback: result.feedback,
      suggested_improvement: result.suggestedImprovement,
      strengths: result.strengths,
      improvements: result.improvements,
      submitted_at: now,
      updated_at: now
    }, { onConflict: "session_id,question_id" });
    if (responseError) throw responseError;

    const { data: scoredResponses, error: scoreError } = await client.from("interview_preparation_responses").select("ai_score").eq("session_id", sessionId).eq("submission_status", "submitted");
    if (scoreError) throw scoreError;
    const scores = (scoredResponses || []).map((row) => Number(row.ai_score)).filter(Number.isFinite);
    const answerAverage = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : Number(session.readiness_score || 0);
    const readinessScore = Math.round(Number(session.readiness_score || 0) * 0.35 + answerAverage * 0.65);
    const completed = scores.length >= questions.length;
    const { data: updatedSession, error: updateError } = await client.from("interview_preparation_sessions").update({
      current_question: Math.min(questions.length, scores.length),
      readiness_score: readinessScore,
      status: completed ? "completed" : "in_progress",
      completed_at: completed ? now : null,
      updated_at: now
    }).eq("id", sessionId).select("*").single();
    if (updateError) throw updateError;
    return NextResponse.json({ preparation: await mapPreparationSession(client, updatedSession), saved: "submitted" });
  } catch (error) {
    const status = Number((error as any)?.status || 500);
    return NextResponse.json({ error: interviewSetupError(error) }, { status });
  }
}
