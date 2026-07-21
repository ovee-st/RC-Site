import { NextResponse } from "next/server";
import { atsErrorResponse, atsRateResponse, enforceAtsWriteRate, ensureDefaultPipeline, isUuid, requireAtsRequester, requireOwnedApplication, runAutomationRules } from "@/lib/ats/server";
import type { AutomationTrigger } from "@/lib/ats/automation";

const EVENTS = new Set<AutomationTrigger>(["stage_entered", "offer_accepted", "assessment_completed"]);

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true);
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "automation", 60)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const event = body.event as AutomationTrigger;
    if (!isUuid(body.application_id) || !EVENTS.has(event)) return NextResponse.json({ error: "A valid application_id and automation event are required." }, { status: 400 });
    if (!await requireOwnedApplication(context, body.application_id)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const pipeline = await ensureDefaultPipeline(context);
    const executed = await runAutomationRules(context, { pipelineId: pipeline.id, applicationId: body.application_id, event, payload: body.payload && typeof body.payload === "object" ? body.payload : {} });
    return NextResponse.json({ ok: true, executed });
  } catch (error) { return atsErrorResponse(error, "Could not run workflow automation."); }
}
