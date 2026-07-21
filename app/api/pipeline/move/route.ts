import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, ensureDefaultPipeline, isUuid, requireAtsRequester, requireOwnedApplication, runAutomationRules } from "@/lib/ats/server";
import { validateStageMove } from "@/lib/ats/workflowEngine";

const OPERATIONS = new Set(["move", "assign", "tag", "archive", "reject"]);

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true);
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "pipeline_move", 80)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const operation = cleanText(body.operation, 20) || "move";
    if (!OPERATIONS.has(operation)) return NextResponse.json({ error: "Unsupported bulk operation." }, { status: 400 });
    const rawIds: unknown[] = Array.isArray(body.application_ids) ? body.application_ids : [body.application_id];
    const applicationIds = Array.from(new Set<string>(rawIds.filter((value): value is string => isUuid(value)))).slice(0, 100);
    if (!applicationIds.length) return NextResponse.json({ error: "At least one valid application is required." }, { status: 400 });
    const pipeline = await ensureDefaultPipeline(context);
    const { data: stages, error: stagesError } = await context.client.from("pipeline_stages").select("id,name,is_terminal,is_archived").eq("pipeline_id", pipeline.id);
    if (stagesError) throw new Error(stagesError.message);

    let targetStageId: string = isUuid(body.stage_id) ? body.stage_id : "";
    if (operation === "archive") targetStageId = stages?.find((stage) => stage.name === "Archived")?.id || "";
    if (operation === "reject") targetStageId = stages?.find((stage) => stage.name === "Rejected")?.id || "";
    const targetStage = stages?.find((stage) => stage.id === targetStageId);
    if ((operation === "move" || operation === "archive" || operation === "reject") && !targetStage) {
      return NextResponse.json({ error: "A valid destination stage is required." }, { status: 400 });
    }
    const recruiterId: string | null = isUuid(body.recruiter_id) ? body.recruiter_id : null;
    const tag = cleanText(body.tag, 40);
    if (operation === "assign" && !recruiterId) return NextResponse.json({ error: "A valid recruiter_id is required." }, { status: 400 });
    if (operation === "tag" && !tag) return NextResponse.json({ error: "A tag is required." }, { status: 400 });

    const moved: Array<{ applicationId: string; fromStageId: string | null; toStageId: string | null }> = [];
    for (const applicationId of applicationIds) {
      const application = await requireOwnedApplication(context, applicationId);
      if (!application) return NextResponse.json({ error: "One or more applications were not found or are outside your workspace." }, { status: 404 });
      const currentResult = await context.client.from("candidate_stages").select("id,stage_id,tags,assigned_recruiter_id").eq("application_id", applicationId).eq("pipeline_id", pipeline.id).maybeSingle();
      if (currentResult.error || !currentResult.data) throw new Error(currentResult.error?.message || "Candidate stage was not initialized.");
      const current = currentResult.data;
      const currentStageId = String(current.stage_id);
      const currentStage = stages?.find((stage) => stage.id === currentStageId);

      if (operation === "assign") {
        const update = await context.client.from("candidate_stages").update({ assigned_recruiter_id: recruiterId, updated_at: new Date().toISOString() }).eq("id", current.id);
        if (update.error) throw new Error(update.error.message);
        await appendTimeline(context, { applicationId, pipelineId: pipeline.id, eventType: "recruiter_assigned", title: "Recruiter assigned", metadata: { recruiter_id: recruiterId, previous_recruiter_id: current.assigned_recruiter_id } });
        moved.push({ applicationId, fromStageId: currentStageId, toStageId: currentStageId });
        continue;
      }
      if (operation === "tag") {
        const tags = Array.from(new Set<string>([...(Array.isArray(current.tags) ? current.tags.map(String) : []), tag])).slice(0, 20);
        const update = await context.client.from("candidate_stages").update({ tags, updated_at: new Date().toISOString() }).eq("id", current.id);
        if (update.error) throw new Error(update.error.message);
        await appendTimeline(context, { applicationId, pipelineId: pipeline.id, eventType: "tag_added", title: "Candidate tag added", metadata: { tag } });
        moved.push({ applicationId, fromStageId: currentStageId, toStageId: currentStageId });
        continue;
      }

      const validation = validateStageMove({ currentStageId, targetStageId, targetArchived: Boolean(targetStage?.is_archived), currentTerminal: Boolean(currentStage?.is_terminal), actorRole: context.role });
      if (!validation.allowed) return NextResponse.json({ error: validation.reason, application_id: applicationId }, { status: 409 });
      const now = new Date().toISOString();
      const update = await context.client.from("candidate_stages").update({ stage_id: targetStageId, entered_at: now, updated_at: now }).eq("id", current.id);
      if (update.error) throw new Error(update.error.message);
      const legacyUpdate = await context.client.from("applications").update({ status: targetStage?.name || "Applied" }).eq("id", applicationId);
      if (legacyUpdate.error) throw new Error(legacyUpdate.error.message);
      await appendTimeline(context, { applicationId, pipelineId: pipeline.id, eventType: "stage_moved", title: `Moved to ${targetStage?.name}`, description: cleanText(body.reason, 500) || null, metadata: { from_stage_id: currentStageId, from_stage: currentStage?.name || null, to_stage_id: targetStageId, to_stage: targetStage?.name || null, operation } });
      moved.push({ applicationId, fromStageId: currentStageId, toStageId: targetStageId });
      await runAutomationRules(context, { pipelineId: pipeline.id, applicationId, event: "stage_entered", payload: { stage_id: targetStageId, stage_name: targetStage?.name } }).catch((error) => console.error("[ats] stage automation failed", error));
    }
    return NextResponse.json({ ok: true, operation, applications: moved });
  } catch (error) { return atsErrorResponse(error, "Could not update candidate stages."); }
}
