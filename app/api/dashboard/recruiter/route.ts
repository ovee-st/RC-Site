import { NextResponse } from "next/server";
import { atsErrorResponse, ensureDefaultPipeline, requireAtsRequester } from "@/lib/ats/server";
import type { RecruiterDashboardDto } from "@/types/ats";

function hoursBetween(from: string, to = new Date().toISOString()) { return Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000); }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const pipeline = await ensureDefaultPipeline(context);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [stagesResult, currentResult, applicationsToday, interviews, tasks, offers, hiredEvents, aiAudits] = await Promise.all([
      context.client.from("pipeline_stages").select("id,name,position").eq("pipeline_id", pipeline.id).eq("is_archived", false).order("position"),
      context.client.from("candidate_stages").select("application_id,stage_id,assigned_recruiter_id,source,entered_at").eq("pipeline_id", pipeline.id).limit(5_000),
      context.client.from("applications").select("id", { count: "exact", head: true }).eq("employer_user_id", context.workspaceOwnerId).gte("created_at", today.toISOString()),
      context.client.from("recruitment_interviews").select("id", { count: "exact", head: true }).eq("employer_user_id", context.workspaceOwnerId).eq("status", "scheduled").gte("scheduled_at", new Date().toISOString()),
      context.client.from("recruitment_tasks").select("id,assigned_to", { count: "exact" }).eq("employer_user_id", context.workspaceOwnerId).in("status", ["pending", "in_progress", "overdue"]).limit(5_000),
      context.client.from("recruitment_offers").select("id", { count: "exact", head: true }).eq("employer_user_id", context.workspaceOwnerId).in("status", ["draft", "internal_approval", "sent", "viewed"]),
      context.client.from("application_timeline_events").select("application_id,event_type,created_at,metadata").eq("pipeline_id", pipeline.id).in("event_type", ["applied", "stage_moved", "offer_accepted"]).order("created_at").limit(10_000),
      context.client.from("candidate_ai_decision_audit").select("action,human_action,confidence,created_at").eq("actor_id", context.userId).order("created_at", { ascending: false }).limit(2_000)
    ]);
    if (stagesResult.error) throw new Error(stagesResult.error.message); if (currentResult.error) throw new Error(currentResult.error.message);
    const stages = stagesResult.data || []; const current = currentResult.data || []; const counts = new Map<string, number>();
    for (const row of current) counts.set(row.stage_id, (counts.get(row.stage_id) || 0) + 1);
    const firstCount = Math.max(1, counts.get(stages[0]?.id) || current.length || 1);
    const pipelineFunnel = stages.map((stage) => ({ stageId: stage.id, stage: stage.name, count: counts.get(stage.id) || 0, conversion: Math.round(((counts.get(stage.id) || 0) / firstCount) * 100) }));
    const timeInStage = stages.map((stage) => { const values = current.filter((row) => row.stage_id === stage.id).map((row) => hoursBetween(row.entered_at)); return { stageId: stage.id, stage: stage.name, averageHours: Math.round((average(values) || 0) * 10) / 10 }; });
    const eventRows = hiredEvents.data || []; const byApplication = new Map<string, typeof eventRows>(); for (const event of eventRows) { const list = byApplication.get(event.application_id) || []; list.push(event); byApplication.set(event.application_id, list); }
    const hireDays: number[] = []; for (const events of byApplication.values()) { const start = events.find((event) => event.event_type === "applied"); const hired = events.find((event) => event.event_type === "stage_moved" && (event.metadata as Record<string, unknown>)?.to_stage === "Hired"); if (start && hired) hireDays.push(hoursBetween(start.created_at, hired.created_at) / 24); }
    const sources = new Map<string, { applications: number; hires: number }>(); for (const row of current) { const source = row.source || "Direct"; const value = sources.get(source) || { applications: 0, hires: 0 }; value.applications += 1; if (stages.find((stage) => stage.id === row.stage_id)?.name === "Hired") value.hires += 1; sources.set(source, value); }
    const recruiterCounts = new Map<string, number>(); for (const row of current) if (row.assigned_recruiter_id) recruiterCounts.set(row.assigned_recruiter_id, (recruiterCounts.get(row.assigned_recruiter_id) || 0) + 1);
    const taskCounts = new Map<string, number>(); for (const row of tasks.data || []) if (row.assigned_to) taskCounts.set(row.assigned_to, (taskCounts.get(row.assigned_to) || 0) + 1);
    const recruiterIds = Array.from(new Set([...recruiterCounts.keys(), ...taskCounts.keys()])); const profiles = recruiterIds.length ? await context.client.from("profiles").select("id,full_name,name").in("id", recruiterIds) : { data: [] }; const names = new Map((profiles.data || []).map((profile) => [profile.id, profile.full_name || profile.name || "Recruiter"]));
    const aiRows = aiAudits.data || []; const accepted = aiRows.filter((row) => ["shortlisted", "invited", "offered"].includes(String(row.human_action))).length;
    const result: RecruiterDashboardDto = { applicationsToday: applicationsToday.count || 0, openInterviews: interviews.count || 0, pendingTasks: tasks.count || 0, activeOffers: offers.count || 0, hiringVelocityDays: average(hireDays) === null ? null : Math.round((average(hireDays) || 0) * 10) / 10, averageTimeToHireDays: average(hireDays) === null ? null : Math.round((average(hireDays) || 0) * 10) / 10, aiRecommendationAcceptance: aiRows.length ? Math.round((accepted / aiRows.length) * 100) : null, pipelineFunnel, timeInStage, sourceQuality: Array.from(sources, ([source, value]) => ({ source, ...value })), recruiterWorkload: recruiterIds.map((recruiterId) => ({ recruiterId, recruiter: names.get(recruiterId) || "Recruiter", candidates: recruiterCounts.get(recruiterId) || 0, tasks: taskCounts.get(recruiterId) || 0 })) };
    return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=90" } });
  } catch (error) { return atsErrorResponse(error, "Could not load recruiter dashboard metrics."); }
}
