import { NextResponse } from "next/server";
import { scoreInterviewAnswer } from "@/lib/interviewPreparation";
import { interviewSetupError, mapPreparationSession, requireCandidate } from "@/lib/interviewPreparationServer";
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
          { role: "system", content: "Score a mock interview answer from 0-100. Return JSON {score,feedback,strengths:string[],improvements:string[]}. Be specific, constructive, and concise." },
          { role: "user", content: JSON.stringify({ question: question.question, type: question.type, focus: question.focus, answer }) }
        ]
      })
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    const result = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    return {
      score: Math.max(0, Math.min(100, Number(result.score) || fallback.score)),
      feedback: String(result.feedback || fallback.feedback),
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String).slice(0, 4) : fallback.strengths,
      improvements: Array.isArray(result.improvements) ? result.improvements.map(String).slice(0, 4) : fallback.improvements
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
    if (!questionId || answer.length < 20) {
      return NextResponse.json({ error: "Choose a question and provide an answer of at least 20 characters." }, { status: 400 });
    }

    const { data: session, error: sessionError } = await client.from("interview_preparation_sessions").select("*").eq("id", sessionId).eq("candidate_user_id", user.id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return NextResponse.json({ error: "Interview preparation session was not found." }, { status: 404 });
    if (!session.is_pro || session.mode !== "mock") {
      return NextResponse.json({ error: "AI answer scoring is available with Candidate Pro mock interviews." }, { status: 403 });
    }

    const questions = Array.isArray(session.questions) ? session.questions as InterviewQuestion[] : [];
    const question = questions.find((item) => item.id === questionId);
    if (!question) return NextResponse.json({ error: "Interview question was not found." }, { status: 404 });
    const result = await getAiFeedback(question, answer);
    const now = new Date().toISOString();
    const { error: responseError } = await client.from("interview_preparation_responses").upsert({
      session_id: sessionId,
      question_id: questionId,
      answer,
      ai_score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      improvements: result.improvements,
      updated_at: now
    }, { onConflict: "session_id,question_id" });
    if (responseError) throw responseError;

    const { data: scoredResponses, error: scoreError } = await client.from("interview_preparation_responses").select("ai_score").eq("session_id", sessionId);
    if (scoreError) throw scoreError;
    const scores = (scoredResponses || []).map((row) => Number(row.ai_score)).filter(Number.isFinite);
    const readinessScore = scores.length ? Math.round((Number(session.readiness_score || 0) + scores.reduce((sum, score) => sum + score, 0) / scores.length) / 2) : Number(session.readiness_score || 0);
    const completed = scores.length >= questions.length;
    const { data: updatedSession, error: updateError } = await client.from("interview_preparation_sessions").update({
      current_question: Math.min(questions.length, scores.length),
      readiness_score: readinessScore,
      status: completed ? "completed" : "in_progress",
      completed_at: completed ? now : null,
      updated_at: now
    }).eq("id", sessionId).select("*").single();
    if (updateError) throw updateError;
    return NextResponse.json({ preparation: await mapPreparationSession(client, updatedSession) });
  } catch (error) {
    const status = Number((error as any)?.status || 500);
    return NextResponse.json({ error: interviewSetupError(error) }, { status });
  }
}
