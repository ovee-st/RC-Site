import { NextResponse } from "next/server";
import { atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, ensureDefaultPipeline, isUuid, requireAtsRequester } from "@/lib/ats/server";
import { canDeleteStage, legacyStatusToStage, slugifyStage } from "@/lib/ats/workflowEngine";
import type { PipelineCandidateDto, PipelineDto, PipelineStageDto } from "@/types/ats";

const APPLICATION_SELECT = "id,candidate_user_id,candidate_id,employer_id,employer_user_id,job_id,job_post_id,job_role,status,created_at";

function list(value: Array<string | null | undefined>) {
  return Array.from(new Set(value.filter((item): item is string => Boolean(item && isUuid(item)))));
}

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request);
    if ("response" in context) return context.response;
    const url = new URL(request.url);
    const limit = Math.max(10, Math.min(200, Number(url.searchParams.get("limit") || 100)));
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const stageFilter = url.searchParams.get("stage_id") || "";
    const jobFilter = url.searchParams.get("job_id") || "";
    const search = cleanText(url.searchParams.get("search"), 120).toLowerCase();
    const pipeline = await ensureDefaultPipeline(context);
    const { data: stageRows, error: stageError } = await context.client.from("pipeline_stages").select("id,pipeline_id,name,slug,position,color,is_terminal,is_archived").eq("pipeline_id", pipeline.id).order("position");
    if (stageError) throw new Error(stageError.message);

    let applicationQuery = context.client.from("applications").select(APPLICATION_SELECT, { count: "exact" }).order("created_at", { ascending: false });
    if (context.role !== "admin") {
      const ownership = [`employer_user_id.eq.${context.workspaceOwnerId}`];
      if (context.employerId) ownership.push(`employer_id.eq.${context.employerId}`);
      applicationQuery = applicationQuery.or(ownership.join(","));
    }
    if (isUuid(stageFilter)) {
      const stageApplications = await context.client.from("candidate_stages").select("application_id").eq("pipeline_id", pipeline.id).eq("stage_id", stageFilter).limit(10_000);
      if (stageApplications.error) throw new Error(stageApplications.error.message);
      const ids = (stageApplications.data || []).map((row) => row.application_id);
      applicationQuery = applicationQuery.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    if (isUuid(jobFilter)) applicationQuery = applicationQuery.eq("job_id", jobFilter);
    const from = (page - 1) * limit;
    const applicationsResult = await applicationQuery.range(from, from + limit - 1);
    if (applicationsResult.error) throw new Error(applicationsResult.error.message);
    const applications = (applicationsResult.data || []) as Array<Record<string, unknown>>;
    const applicationIds = applications.map((item) => String(item.id));
    const currentResult = applicationIds.length ? await context.client.from("candidate_stages").select("id,application_id,pipeline_id,stage_id,assigned_recruiter_id,tags,source,entered_at,updated_at").in("application_id", applicationIds) : { data: [], error: null };
    if (currentResult.error) throw new Error(currentResult.error.message);
    const currentRows = [...(currentResult.data || [])];
    const initialized = new Set(currentRows.map((row) => String(row.application_id)));
    const missing = applications.filter((application) => !initialized.has(String(application.id)));
    if (missing.length) {
      const activeStages = (stageRows || []).filter((stage) => !stage.is_archived);
      const initialRows = missing.map((application) => {
        const desired = legacyStatusToStage(String(application.status || "Applied"));
        const stage = activeStages.find((item) => item.name === desired) || activeStages[0];
        if (!stage) throw new Error("Pipeline has no active stages.");
        return { application_id: application.id, pipeline_id: pipeline.id, stage_id: stage.id, source: "legacy_application" };
      });
      const inserted = await context.client.from("candidate_stages").insert(initialRows).select("id,application_id,pipeline_id,stage_id,assigned_recruiter_id,tags,source,entered_at,updated_at");
      if (inserted.error) throw new Error(inserted.error.message);
      currentRows.push(...(inserted.data || []));
      const timelineRows = (inserted.data || []).map((row) => ({ application_id: row.application_id, pipeline_id: pipeline.id, event_type: "applied", title: "Application added to pipeline", actor_id: context.userId, actor_name: context.actorName, metadata: { stage_id: row.stage_id, imported: true } }));
      if (timelineRows.length) await context.client.from("application_timeline_events").insert(timelineRows);
    }
    const candidateIds = list(applications.flatMap((item) => [String(item.candidate_user_id || ""), String(item.candidate_id || "")]));
    const jobIds = list(applications.map((item) => String(item.job_id || "")));
    const jobPostIds = list(applications.map((item) => String(item.job_post_id || "")));
    const recruiterIds = list(currentRows.map((item) => item.assigned_recruiter_id));

    const [candidatesByUser, candidatesById, jobs, jobPosts, recruiters, aiAudits, stageCountRows] = await Promise.all([
      candidateIds.length ? context.client.from("candidates").select("id,user_id,full_name,name,photo_url,avatar").in("user_id", candidateIds) : Promise.resolve({ data: [] }),
      candidateIds.length ? context.client.from("candidates").select("id,user_id,full_name,name,photo_url,avatar").in("id", candidateIds) : Promise.resolve({ data: [] }),
      jobIds.length ? context.client.from("jobs").select("id,job_title,company_name").in("id", jobIds) : Promise.resolve({ data: [] }),
      jobPostIds.length ? context.client.from("job_posts").select("id,title,role_needed").in("id", jobPostIds) : Promise.resolve({ data: [] }),
      recruiterIds.length ? context.client.from("profiles").select("id,full_name,name").in("id", recruiterIds) : Promise.resolve({ data: [] }),
      candidateIds.length ? context.client.from("candidate_ai_decision_audit").select("candidate_id,job_id,confidence,created_at").in("candidate_id", candidateIds).order("created_at", { ascending: false }).limit(500) : Promise.resolve({ data: [] }),
      context.client.rpc("ats_pipeline_stage_counts", { target_pipeline: pipeline.id })
    ]);

    const candidateMap = new Map<string, Record<string, unknown>>();
    if (stageCountRows.error) throw new Error(stageCountRows.error.message);
    for (const row of [...(candidatesByUser.data || []), ...(candidatesById.data || [])] as Array<Record<string, unknown>>) {
      if (row.id) candidateMap.set(String(row.id), row);
      if (row.user_id) candidateMap.set(String(row.user_id), row);
    }
    const jobMap = new Map<string, Record<string, unknown>>();
    for (const row of [...(jobs.data || []), ...(jobPosts.data || [])] as Array<Record<string, unknown>>) jobMap.set(String(row.id), row);
    const recruiterMap = new Map((recruiters.data || []).map((row) => [String(row.id), String(row.full_name || row.name || "Recruiter")]));
    const aiMap = new Map<string, number>();
    for (const row of aiAudits.data || []) {
      const key = `${row.candidate_id}:${row.job_id || ""}`;
      if (!aiMap.has(key)) aiMap.set(key, Number(row.confidence));
    }
    const stageMap = new Map((stageRows || []).map((stage) => [stage.id, stage]));
    const currentMap = new Map(currentRows.map((row) => [String(row.application_id), row]));

    let candidates: PipelineCandidateDto[] = applications.map((application) => {
      const candidateId = String(application.candidate_user_id || application.candidate_id || "");
      const candidate = candidateMap.get(candidateId) || {};
      const jobId = String(application.job_id || application.job_post_id || "");
      const job = jobMap.get(jobId) || {};
      const current = currentMap.get(String(application.id));
      const stage = stageMap.get(current?.stage_id);
      return {
        applicationId: String(application.id), candidateId,
        candidateName: String(candidate.full_name || candidate.name || "Candidate"),
        candidatePhoto: String(candidate.photo_url || candidate.avatar || "") || null,
        jobId, jobTitle: String(job.job_title || job.title || job.role_needed || application.job_role || "Applied role"),
        stageId: String(current?.stage_id || ""), stageName: String(stage?.name || "Applied"),
        matchScore: aiMap.get(`${candidateId}:${String(application.job_id || "")}`) ?? aiMap.get(`${String(candidate.id || "")}:${String(application.job_id || "")}`) ?? null,
        status: String(application.status || "Applied"),
        recruiterId: current?.assigned_recruiter_id || null,
        recruiterName: current?.assigned_recruiter_id ? recruiterMap.get(String(current.assigned_recruiter_id)) || "Recruiter" : null,
        applicationDate: String(application.created_at || new Date().toISOString()),
        tags: Array.isArray(current?.tags) ? current.tags : [],
        stageEnteredAt: String(current?.entered_at || application.created_at || new Date().toISOString())
      };
    });
    if (search) candidates = candidates.filter((candidate) => `${candidate.candidateName} ${candidate.jobTitle} ${candidate.recruiterName || ""} ${candidate.tags.join(" ")}`.toLowerCase().includes(search));

    const countMap = new Map<string, number>();
    for (const row of stageCountRows.data || []) countMap.set(row.stage_id, Number(row.candidate_count || 0));
    const stages: PipelineStageDto[] = (stageRows || []).map((stage) => ({ id: stage.id, pipelineId: stage.pipeline_id, name: stage.name, slug: stage.slug, position: stage.position, color: stage.color, isTerminal: stage.is_terminal, isArchived: stage.is_archived, candidateCount: countMap.get(stage.id) || 0 }));
    const total = applicationsResult.count || applications.length;
    const response: PipelineDto = { id: pipeline.id, name: pipeline.name, employerUserId: pipeline.employer_user_id, stages, candidates, hasMore: page * limit < total, nextCursor: page * limit < total ? String(page + 1) : null };
    return NextResponse.json(response, { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" } });
  } catch (error) { return atsErrorResponse(error, "Could not load the recruitment pipeline."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true);
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "pipeline_config", 30)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const action = cleanText(body.action, 30);
    const pipeline = await ensureDefaultPipeline(context);

    if (action === "add") {
      const name = cleanText(body.name, 80);
      if (name.length < 2) return NextResponse.json({ error: "Stage name must contain at least two characters." }, { status: 400 });
      const last = await context.client.from("pipeline_stages").select("position").eq("pipeline_id", pipeline.id).order("position", { ascending: false }).limit(1).maybeSingle();
      const result = await context.client.from("pipeline_stages").insert({ pipeline_id: pipeline.id, name, slug: `${slugifyStage(name)}-${crypto.randomUUID().slice(0, 6)}`, position: Number(last.data?.position ?? -1) + 1, color: cleanText(body.color, 20) || "#2563eb" }).select("id,pipeline_id,name,slug,position,color,is_terminal,is_archived").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ stage: result.data }, { status: 201 });
    }

    const stageId = body.stage_id;
    if (!isUuid(stageId)) return NextResponse.json({ error: "A valid stage_id is required." }, { status: 400 });
    const stageResult = await context.client.from("pipeline_stages").select("id,pipeline_id,name,is_terminal,is_archived").eq("id", stageId).eq("pipeline_id", pipeline.id).maybeSingle();
    if (stageResult.error || !stageResult.data) return NextResponse.json({ error: "Pipeline stage was not found." }, { status: 404 });

    if (action === "rename") {
      const name = cleanText(body.name, 80);
      if (name.length < 2) return NextResponse.json({ error: "Stage name must contain at least two characters." }, { status: 400 });
      const result = await context.client.from("pipeline_stages").update({ name, updated_at: new Date().toISOString() }).eq("id", stageId).select("id,name").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ stage: result.data });
    }
    if (action === "archive") {
      if (Boolean(body.archived)) {
        const count = await context.client.from("candidate_stages").select("id", { count: "exact", head: true }).eq("stage_id", stageId);
        if ((count.count || 0) > 0) return NextResponse.json({ error: "Move active candidates before archiving this stage." }, { status: 409 });
      }
      const result = await context.client.from("pipeline_stages").update({ is_archived: Boolean(body.archived), updated_at: new Date().toISOString() }).eq("id", stageId).select("id,is_archived").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ stage: result.data });
    }
    if (action === "reorder") {
      const ordered = Array.isArray(body.stage_ids) ? body.stage_ids.filter(isUuid) : [];
      if (!ordered.length) return NextResponse.json({ error: "stage_ids are required for reordering." }, { status: 400 });
      const results = await Promise.all(ordered.map((id: string, position: number) => context.client.from("pipeline_stages").update({ position, updated_at: new Date().toISOString() }).eq("id", id).eq("pipeline_id", pipeline.id)));
      const failed = results.find((result) => result.error);
      if (failed?.error) throw new Error(failed.error.message);
      return NextResponse.json({ stage_ids: ordered });
    }
    if (action === "remove") {
      const count = await context.client.from("candidate_stages").select("id", { count: "exact", head: true }).eq("stage_id", stageId);
      const allowed = canDeleteStage(count.count || 0);
      if (!allowed.allowed) return NextResponse.json({ error: allowed.reason }, { status: 409 });
      const result = await context.client.from("pipeline_stages").delete().eq("id", stageId);
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ removed: stageId });
    }
    return NextResponse.json({ error: "Unsupported pipeline action." }, { status: 400 });
  } catch (error) { return atsErrorResponse(error, "Could not update the recruitment pipeline."); }
}
