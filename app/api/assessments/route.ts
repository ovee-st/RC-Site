import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, ensureDefaultPipeline, isUuid, notifyRecruiter, requireAtsRequester, requireOwnedApplication, runAutomationRules } from "@/lib/ats/server";

const STATUSES = new Set(["assigned", "started", "completed", "expired"]);
const SELECT = "id,employer_user_id,application_id,title,provider,external_reference,status,assigned_at,started_at,completed_at,expires_at,score,feedback,metadata,created_by,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const applicationId = new URL(request.url).searchParams.get("application_id") || "";
    let query = context.client.from("recruitment_assessments").select(SELECT).eq("employer_user_id", context.workspaceOwnerId).order("updated_at", { ascending: false }).limit(100);
    if (applicationId) { if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 }); query = query.eq("application_id", applicationId); }
    const { data, error } = await query; if (error) throw new Error(error.message); return NextResponse.json({ assessments: data || [] });
  } catch (error) { return atsErrorResponse(error, "Could not load assessments."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "assessments", 40)) return atsRateResponse();
    const body = await request.json().catch(() => ({})); const title = cleanText(body.title, 160);
    if (!isUuid(body.application_id) || !title || !await requireOwnedApplication(context, body.application_id)) return NextResponse.json({ error: "A valid application and assessment title are required." }, { status: 400 });
    const result = await context.client.from("recruitment_assessments").insert({ employer_user_id: context.workspaceOwnerId, application_id: body.application_id, title, provider: cleanText(body.provider, 80) || "manual", external_reference: cleanText(body.external_reference, 500) || null, expires_at: body.expires_at || null, metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : {}, created_by: context.userId }).select(SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await appendTimeline(context, { applicationId: body.application_id, eventType: "assessment_assigned", title: "Assessment assigned", description: title, metadata: { assessment_id: result.data.id } });
    return NextResponse.json({ assessment: result.data }, { status: 201 });
  } catch (error) { return atsErrorResponse(error, "Could not assign the assessment."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    const body = await request.json().catch(() => ({})); const status = cleanText(body.status, 30);
    if (!isUuid(body.assessment_id) || !STATUSES.has(status)) return NextResponse.json({ error: "A valid assessment_id and status are required." }, { status: 400 });
    const existing = await context.client.from("recruitment_assessments").select("id,application_id,status").eq("id", body.assessment_id).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
    if (!existing.data) return NextResponse.json({ error: "Assessment was not found." }, { status: 404 });
    const score = body.score === undefined || body.score === null || body.score === "" ? null : Number(body.score); if (score !== null && !Number.isFinite(score)) return NextResponse.json({ error: "Assessment score must be numeric." }, { status: 400 });
    const now = new Date().toISOString(); const timestamps: Record<string, string> = {}; if (status === "started") timestamps.started_at = now; if (status === "completed") timestamps.completed_at = now;
    const result = await context.client.from("recruitment_assessments").update({ status, ...timestamps, ...(score === null ? {} : { score }), feedback: cleanText(body.feedback, 2_000) || null, updated_at: now }).eq("id", body.assessment_id).select(SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await appendTimeline(context, { applicationId: existing.data.application_id, eventType: `assessment_${status}`, title: `Assessment ${status}`, metadata: { assessment_id: body.assessment_id, score: result.data.score } });
    if (status === "completed") { const pipeline = await ensureDefaultPipeline(context); await notifyRecruiter(context, { applicationId: existing.data.application_id, type: "assessment_completed", title: "Assessment completed", message: "A candidate assessment is ready for review.", metadata: { assessment_id: body.assessment_id } }); await runAutomationRules(context, { pipelineId: pipeline.id, applicationId: existing.data.application_id, event: "assessment_completed", payload: { assessment_id: body.assessment_id, score: result.data.score } }); }
    return NextResponse.json({ assessment: result.data });
  } catch (error) { return atsErrorResponse(error, "Could not update the assessment."); }
}
