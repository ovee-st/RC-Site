import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, requireAtsRequester, requireOwnedApplication } from "@/lib/ats/server";

const TYPES = new Set(["email", "interview_invitation", "sms", "note", "system"]);

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const applicationId = new URL(request.url).searchParams.get("application_id") || "";
    if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const { data, error } = await context.client.from("recruitment_communications").select("id,application_id,communication_type,direction,subject,body,actor_id,recipient_ids,metadata,created_at").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message); return NextResponse.json({ communications: data || [] });
  } catch (error) { return atsErrorResponse(error, "Could not load communication history."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "communications", 60)) return atsRateResponse();
    const body = await request.json().catch(() => ({})); const rawIds: unknown[] = Array.isArray(body.application_ids) ? body.application_ids : [body.application_id]; const applicationIds = rawIds.filter((value): value is string => isUuid(value)).slice(0, 100); const type = cleanText(body.communication_type, 30) || "email"; const subject = cleanText(body.subject, 200); const message = cleanText(body.body, 10_000);
    if (!applicationIds.length || !TYPES.has(type) || !message) return NextResponse.json({ error: "Applications, communication type, and message are required." }, { status: 400 });
    for (const applicationId of applicationIds) if (!await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "One or more applications were not found." }, { status: 404 });
    const rows = applicationIds.map((applicationId) => ({ application_id: applicationId, communication_type: type, direction: "outbound", subject: subject || null, body: message, actor_id: context.userId, metadata: { delivery_status: "logged", provider: null } }));
    const result = await context.client.from("recruitment_communications").insert(rows).select("id,application_id,communication_type,direction,subject,body,created_at"); if (result.error) throw new Error(result.error.message);
    for (const applicationId of applicationIds) await appendTimeline(context, { applicationId, eventType: `${type}_logged`, title: type === "email" ? "Email logged" : "Communication logged", description: subject || null, metadata: { delivery_status: "logged" } });
    return NextResponse.json({ communications: result.data || [], note: "Communication is recorded. Delivery providers can be connected without changing the workflow contract." }, { status: 201 });
  } catch (error) { return atsErrorResponse(error, "Could not record communication."); }
}
