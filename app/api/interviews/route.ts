import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, notifyRecruiter, requireAtsRequester, requireOwnedApplication } from "@/lib/ats/server";

const TYPES = new Set(["phone", "video", "onsite", "panel", "technical", "hr", "final"]);
const STATUSES = new Set(["scheduled", "completed", "cancelled", "rescheduled"]);
const INTERVIEW_SELECT = "id,employer_user_id,application_id,interview_type,status,scheduled_at,duration_minutes,timezone,agenda,meeting_link,location,notes,rescheduled_from,created_by,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request, false, "interviews");
    if ("response" in context) return context.response;
    const applicationId = new URL(request.url).searchParams.get("application_id") || "";
    let query = context.client.from("recruitment_interviews").select(INTERVIEW_SELECT).eq("employer_user_id", context.workspaceOwnerId).order("scheduled_at", { ascending: true }).limit(100);
    if (applicationId) {
      if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
      query = query.eq("application_id", applicationId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (data || []).map((interview) => interview.id);
    const feedback = ids.length ? await context.client.from("interview_feedback").select("interview_id,communication,technical,leadership,problem_solving,culture_fit,experience,overall,recommendation,submitted_at").in("interview_id", ids) : { data: [] };
    const categories = ["communication", "technical", "leadership", "problem_solving", "culture_fit", "experience", "overall"];
    const interviewsWithFeedback = (data || []).map((interview) => {
      const rows = (feedback.data || []).filter((row) => row.interview_id === interview.id);
      const averages = Object.fromEntries(categories.map((category) => [category, rows.length ? Math.round((rows.reduce((sum, row) => sum + Number((row as Record<string, unknown>)[category] || 0), 0) / rows.length) * 10) / 10 : null]));
      return { ...interview, feedback_summary: { submissions: rows.length, averages } };
    });
    return NextResponse.json({ interviews: interviewsWithFeedback });
  } catch (error) { return atsErrorResponse(error, "Could not load interviews."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "interviews");
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "interviews", 40)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const applicationId = body.application_id;
    const interviewType = cleanText(body.interview_type, 30).toLowerCase();
    const scheduledAt = new Date(body.scheduled_at);
    if (!isUuid(applicationId) || !TYPES.has(interviewType) || !Number.isFinite(scheduledAt.getTime())) return NextResponse.json({ error: "application_id, interview_type, and a valid scheduled_at are required." }, { status: 400 });
    if (!await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const duration = Math.max(5, Math.min(480, Number(body.duration_minutes || 45)));
    const { data, error } = await context.client.from("recruitment_interviews").insert({ employer_user_id: context.workspaceOwnerId, application_id: applicationId, interview_type: interviewType, status: "scheduled", scheduled_at: scheduledAt.toISOString(), duration_minutes: duration, timezone: cleanText(body.timezone, 80) || "Asia/Dhaka", agenda: cleanText(body.agenda, 2_000) || null, meeting_link: cleanText(body.meeting_link, 500) || null, location: cleanText(body.location, 500) || null, notes: cleanText(body.notes, 2_000) || null, rescheduled_from: isUuid(body.rescheduled_from) ? body.rescheduled_from : null, created_by: context.userId }).select(INTERVIEW_SELECT).single();
    if (error) throw new Error(error.message);
    const interviewers = Array.isArray(body.interviewer_ids) ? Array.from(new Set(body.interviewer_ids.filter(isUuid))).slice(0, 20) : [];
    if (interviewers.length) await context.client.from("interview_participants").insert(interviewers.map((userId) => ({ interview_id: data.id, user_id: userId, participant_role: "interviewer" })));
    await appendTimeline(context, { applicationId, eventType: body.rescheduled_from ? "interview_rescheduled" : "interview_scheduled", title: body.rescheduled_from ? "Interview rescheduled" : "Interview scheduled", description: `${interviewType} interview on ${scheduledAt.toISOString()}`, metadata: { interview_id: data.id, interview_type: interviewType, scheduled_at: scheduledAt.toISOString(), interviewer_ids: interviewers } });
    await notifyRecruiter(context, { applicationId, type: "interview_reminder", title: "Interview scheduled", message: `A ${interviewType} interview is scheduled for ${scheduledAt.toLocaleString("en-US")}.`, metadata: { interview_id: data.id } });
    return NextResponse.json({ interview: data }, { status: 201 });
  } catch (error) { return atsErrorResponse(error, "Could not schedule the interview."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "interviews");
    if ("response" in context) return context.response;
    const body = await request.json().catch(() => ({}));
    if (!isUuid(body.interview_id)) return NextResponse.json({ error: "A valid interview_id is required." }, { status: 400 });
    if (body.action === "feedback") {
      const scores = ["communication", "technical", "leadership", "problem_solving", "culture_fit", "experience", "overall"];
      if (scores.some((key) => !Number.isInteger(Number(body[key])) || Number(body[key]) < 1 || Number(body[key]) > 5)) return NextResponse.json({ error: "Every scorecard category must be an integer between 1 and 5." }, { status: 400 });
      const interview = await context.client.from("recruitment_interviews").select("id,application_id").eq("id", body.interview_id).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
      if (!interview.data) return NextResponse.json({ error: "Interview was not found." }, { status: 404 });
      const row = Object.fromEntries(scores.map((key) => [key, Number(body[key])]));
      const result = await context.client.from("interview_feedback").upsert({ interview_id: body.interview_id, interviewer_id: context.userId, ...row, recommendation: cleanText(body.recommendation, 100), comments: cleanText(body.comments, 2_000) }).select("id,interview_id,interviewer_id,communication,technical,leadership,problem_solving,culture_fit,experience,overall,recommendation,comments,submitted_at").single();
      if (result.error) throw new Error(result.error.message);
      await appendTimeline(context, { applicationId: interview.data.application_id, eventType: "interview_feedback", title: "Interview feedback submitted", metadata: { interview_id: body.interview_id, overall: row.overall } });
      return NextResponse.json({ feedback: result.data });
    }
    const status = cleanText(body.status, 30);
    if (!STATUSES.has(status)) return NextResponse.json({ error: "A valid interview status is required." }, { status: 400 });
    const existing = await context.client.from("recruitment_interviews").select("id,application_id,status").eq("id", body.interview_id).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
    if (!existing.data) return NextResponse.json({ error: "Interview was not found." }, { status: 404 });
    const result = await context.client.from("recruitment_interviews").update({ status, notes: cleanText(body.notes, 2_000) || null, updated_at: new Date().toISOString() }).eq("id", body.interview_id).select(INTERVIEW_SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await appendTimeline(context, { applicationId: existing.data.application_id, eventType: `interview_${status}`, title: `Interview ${status}`, metadata: { interview_id: body.interview_id, previous_status: existing.data.status } });
    return NextResponse.json({ interview: result.data });
  } catch (error) { return atsErrorResponse(error, "Could not update the interview."); }
}
