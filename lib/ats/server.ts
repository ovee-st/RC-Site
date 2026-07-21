import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { defaultAutomationRules, type AutomationTrigger } from "@/lib/ats/automation";
import { canPerformAtsAction, createDefaultStageRows, legacyStatusToStage, type AtsPermission } from "@/lib/ats/workflowEngine";
import { apiErrorResponse } from "@/lib/api/errors";

const ATS_ROLES = new Set(["employer", "employee", "recruiter", "hiring_manager", "interviewer", "admin", "viewer"]);
const WRITE_ROLES = new Set(["employer", "employee", "recruiter", "hiring_manager", "interviewer", "admin"]);
const rateState = globalThis as typeof globalThis & { __atsWriteRates?: Map<string, { count: number; resetAt: number }> };
const writeRates = rateState.__atsWriteRates ||= new Map();

export type AtsClient = ReturnType<typeof createServerSupabaseClient>;
export type AtsRequester = {
  client: AtsClient;
  user: User;
  userId: string;
  workspaceOwnerId: string;
  role: string;
  actorName: string;
  employerId: string | null;
};

export async function requireAtsRequester(request: Request, write = false, permission: AtsPermission = "pipeline") {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return { response: NextResponse.json({ error: "Authentication is required." }, { status: 401 }) } as const;
  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Invalid session." }, { status: 401 }) } as const;
  const { data: profile } = await client.from("profiles").select("role,full_name,name").eq("id", data.user.id).maybeSingle();
  const role = String(profile?.role || data.user.user_metadata?.role || "").toLowerCase();
  const { data: membership } = await client.from("recruitment_team_members").select("employer_user_id,member_role,permissions,status").eq("user_id", data.user.id).eq("status", "active").limit(1).maybeSingle();
  const effectiveRole = String(membership?.member_role || role);
  const memberPermissions = membership?.permissions && typeof membership.permissions === "object" ? membership.permissions as Record<string, unknown> : null;
  if (!ATS_ROLES.has(effectiveRole) || (write && !WRITE_ROLES.has(effectiveRole)) || !canPerformAtsAction(effectiveRole, permission, write, memberPermissions)) {
    return { response: NextResponse.json({ error: write ? "Recruiter write access is required." : "Recruiter access is required." }, { status: 403 }) } as const;
  }
  const workspaceOwnerId = membership?.employer_user_id || data.user.id;
  const { data: employer } = await client.from("employers").select("id").eq("user_id", workspaceOwnerId).limit(1).maybeSingle();
  return {
    client,
    user: data.user,
    userId: data.user.id,
    workspaceOwnerId,
    role: effectiveRole,
    actorName: String(profile?.full_name || profile?.name || data.user.user_metadata?.full_name || "Recruiter"),
    employerId: employer?.id || null
  } as AtsRequester;
}

export function enforceAtsWriteRate(userId: string, scope: string, limit = 60, windowMs = 60_000) {
  const key = `${userId}:${scope}`;
  const now = Date.now();
  const current = writeRates.get(key);
  const next = !current || current.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { ...current, count: current.count + 1 };
  writeRates.set(key, next);
  if (writeRates.size > 1_000) for (const [entryKey, entry] of writeRates) if (entry.resetAt <= now) writeRates.delete(entryKey);
  return next.count <= limit;
}

export function atsRateResponse() {
  return NextResponse.json({ error: "Too many workflow updates. Please wait and try again." }, { status: 429 });
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function ensureDefaultPipeline(context: AtsRequester) {
  const existing = await context.client
    .from("recruitment_pipelines")
    .select("id,employer_user_id,employer_id,name,is_default,is_archived")
    .eq("employer_user_id", context.workspaceOwnerId)
    .eq("is_default", true)
    .eq("is_archived", false)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;

  const inserted = await context.client.from("recruitment_pipelines").insert({
    employer_user_id: context.workspaceOwnerId,
    employer_id: context.employerId,
    name: "Default Hiring Pipeline",
    is_default: true,
    created_by: context.userId
  }).select("id,employer_user_id,employer_id,name,is_default,is_archived").single();
  if (inserted.error) {
    const retry = await context.client.from("recruitment_pipelines").select("id,employer_user_id,employer_id,name,is_default,is_archived").eq("employer_user_id", context.workspaceOwnerId).eq("is_default", true).maybeSingle();
    if (retry.error || !retry.data) throw new Error(inserted.error.message);
    return retry.data;
  }

  const stageRows = createDefaultStageRows(inserted.data.id);
  const stages = await context.client.from("pipeline_stages").insert(stageRows).select("id,name,position");
  if (stages.error) throw new Error(stages.error.message);
  const interview = stages.data?.find((stage) => stage.name === "Interview");
  const hired = stages.data?.find((stage) => stage.name === "Hired");
  if (interview && hired) {
    await context.client.from("workflow_automation_rules").insert(
      defaultAutomationRules(inserted.data.id, interview.id, hired.id).map((rule) => ({ ...rule, created_by: context.userId }))
    );
  }
  return inserted.data;
}

export async function requireOwnedApplication(context: AtsRequester, applicationId: string) {
  let query = context.client.from("applications").select("id,candidate_user_id,candidate_id,employer_id,employer_user_id,job_id,job_post_id,job_role,status,created_at").eq("id", applicationId);
  if (context.role !== "admin") {
    const filters = [`employer_user_id.eq.${context.workspaceOwnerId}`];
    if (context.employerId) filters.push(`employer_id.eq.${context.employerId}`);
    query = query.or(filters.join(","));
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function appendTimeline(context: AtsRequester, input: {
  applicationId: string;
  pipelineId?: string | null;
  eventType: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await context.client.from("application_timeline_events").insert({
    application_id: input.applicationId,
    pipeline_id: input.pipelineId || null,
    event_type: input.eventType,
    title: input.title,
    description: input.description || null,
    actor_id: context.userId,
    actor_name: context.actorName,
    metadata: input.metadata || {}
  });
  if (error) throw new Error(error.message);
}

export async function ensureCandidateStage(context: AtsRequester, application: Record<string, unknown>, pipelineId: string) {
  const existing = await context.client.from("candidate_stages").select("id,application_id,pipeline_id,stage_id,assigned_recruiter_id,tags,source,entered_at,updated_at").eq("application_id", application.id).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data;
  const desiredName = legacyStatusToStage(String(application.status || "Applied"));
  const stages = await context.client.from("pipeline_stages").select("id,name").eq("pipeline_id", pipelineId).eq("is_archived", false).order("position");
  if (stages.error) throw new Error(stages.error.message);
  const stage = stages.data?.find((item) => item.name === desiredName) || stages.data?.[0];
  if (!stage) throw new Error("Pipeline has no active stages.");
  const inserted = await context.client.from("candidate_stages").insert({ application_id: application.id, pipeline_id: pipelineId, stage_id: stage.id, source: "legacy_application" }).select("id,application_id,pipeline_id,stage_id,assigned_recruiter_id,tags,source,entered_at,updated_at").single();
  if (inserted.error) throw new Error(inserted.error.message);
  await appendTimeline(context, { applicationId: String(application.id), pipelineId, eventType: "applied", title: "Application added to pipeline", metadata: { stage_id: stage.id, imported_status: application.status || null } });
  return inserted.data;
}

export async function notifyRecruiter(context: AtsRequester, input: { applicationId?: string; userId?: string; type: string; title: string; message: string; metadata?: Record<string, unknown> }) {
  await context.client.from("recruitment_notifications").insert({
    user_id: input.userId || context.userId,
    application_id: input.applicationId || null,
    notification_type: input.type,
    title: input.title,
    message: input.message,
    metadata: input.metadata || {}
  });
}

export async function runAutomationRules(context: AtsRequester, input: { pipelineId: string; applicationId: string; event: AutomationTrigger; payload: Record<string, unknown> }) {
  const { data: rules, error } = await context.client.from("workflow_automation_rules").select("id,trigger_event,trigger_config,action_type,action_config,enabled").eq("pipeline_id", input.pipelineId).eq("trigger_event", input.event).eq("enabled", true);
  if (error) throw new Error(error.message);
  const executed: string[] = [];
  for (const rule of rules || []) {
    const trigger = (rule.trigger_config || {}) as Record<string, unknown>;
    if (!Object.entries(trigger).every(([key, value]) => value === undefined || input.payload[key] === value)) continue;
    const action = (rule.action_config || {}) as Record<string, unknown>;
    if (rule.action_type === "create_task") {
      const dueHours = Math.max(1, Math.min(720, Number(action.due_in_hours || 24)));
      const title = cleanText(action.title, 160) || "Recruitment follow-up";
      const task = await context.client.from("recruitment_tasks").insert({ employer_user_id: context.workspaceOwnerId, application_id: input.applicationId, title, task_type: cleanText(action.task_type, 80) || "general", due_at: new Date(Date.now() + dueHours * 3_600_000).toISOString(), assigned_to: context.userId, created_by: context.userId }).select("id,due_at").single();
      if (task.error) throw new Error(task.error.message);
      await appendTimeline(context, { applicationId: input.applicationId, pipelineId: input.pipelineId, eventType: "automation_task_created", title: "Automation created a recruitment task", description: title, metadata: { rule_id: rule.id, task_id: task.data.id, due_at: task.data.due_at } });
    } else if (rule.action_type === "move_stage" && isUuid(action.stage_id)) {
      const stage = await context.client.from("pipeline_stages").select("id,name,is_archived").eq("id", action.stage_id).eq("pipeline_id", input.pipelineId).maybeSingle();
      if (stage.error || !stage.data || stage.data.is_archived) throw new Error(stage.error?.message || "Automation destination stage is unavailable.");
      const current = await context.client.from("candidate_stages").select("stage_id").eq("application_id", input.applicationId).maybeSingle();
      const now = new Date().toISOString();
      const moved = await context.client.from("candidate_stages").update({ stage_id: action.stage_id, entered_at: now, updated_at: now }).eq("application_id", input.applicationId);
      if (moved.error) throw new Error(moved.error.message);
      await context.client.from("applications").update({ status: stage.data.name }).eq("id", input.applicationId);
      await appendTimeline(context, { applicationId: input.applicationId, pipelineId: input.pipelineId, eventType: "automation_stage_moved", title: `Automation moved candidate to ${stage.data.name}`, metadata: { rule_id: rule.id, from_stage_id: current.data?.stage_id || null, to_stage_id: stage.data.id, to_stage: stage.data.name } });
    } else if (rule.action_type === "notify_recruiter") {
      await notifyRecruiter(context, { applicationId: input.applicationId, type: input.event, title: cleanText(action.title, 160) || "Recruitment workflow update", message: cleanText(action.message, 500) || "A workflow event needs your attention." });
    }
    executed.push(rule.id);
  }
  return executed;
}

export function atsErrorResponse(error: unknown, fallback = "Recruitment workflow request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const setupRequired = /recruitment_pipelines|pipeline_stages|candidate_stages|application_timeline_events|schema cache|does not exist|could not find/i.test(message);
  if (setupRequired) return NextResponse.json({ error: "The enterprise recruitment workflow migration must be applied before using this feature.", code: "ATS_SETUP_REQUIRED" }, { status: 503 });
  return apiErrorResponse(error, undefined, fallback);
}
