import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, requireAtsRequester, requireOwnedApplication } from "@/lib/ats/server";
import { isTaskOverdue } from "@/lib/ats/workflowEngine";

const STATUSES = new Set(["pending", "in_progress", "completed", "overdue"]);
const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const TASK_SELECT = "id,employer_user_id,application_id,title,description,task_type,status,priority,assigned_to,due_at,completed_at,created_by,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request, false, "tasks");
    if ("response" in context) return context.response;
    const url = new URL(request.url);
    const applicationId = url.searchParams.get("application_id") || "";
    let query = context.client.from("recruitment_tasks").select(TASK_SELECT).eq("employer_user_id", context.workspaceOwnerId).order("due_at", { ascending: true, nullsFirst: false }).limit(100);
    if (applicationId) {
      if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
      query = query.eq("application_id", applicationId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return NextResponse.json({ tasks: (data || []).map((task) => isTaskOverdue(task.status, task.due_at) ? { ...task, status: "overdue" } : task) });
  } catch (error) { return atsErrorResponse(error, "Could not load recruitment tasks."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "tasks");
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "tasks", 60)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const applicationId = body.application_id;
    const title = cleanText(body.title, 160);
    if (!isUuid(applicationId) || !title) return NextResponse.json({ error: "A valid application_id and title are required." }, { status: 400 });
    if (!await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const status = STATUSES.has(body.status) ? body.status : "pending";
    const priority = PRIORITIES.has(body.priority) ? body.priority : "medium";
    const dueAt = body.due_at ? new Date(body.due_at) : null;
    if (dueAt && !Number.isFinite(dueAt.getTime())) return NextResponse.json({ error: "due_at must be a valid date." }, { status: 400 });
    const { data, error } = await context.client.from("recruitment_tasks").insert({ employer_user_id: context.workspaceOwnerId, application_id: applicationId, title, description: cleanText(body.description, 2_000) || null, task_type: cleanText(body.task_type, 80) || "general", status, priority, assigned_to: isUuid(body.assigned_to) ? body.assigned_to : context.userId, due_at: dueAt?.toISOString() || null, completed_at: status === "completed" ? new Date().toISOString() : null, created_by: context.userId }).select(TASK_SELECT).single();
    if (error) throw new Error(error.message);
    await appendTimeline(context, { applicationId, eventType: "task_created", title: "Recruitment task created", description: title, metadata: { task_id: data.id, due_at: data.due_at, assigned_to: data.assigned_to } });
    return NextResponse.json({ task: data }, { status: 201 });
  } catch (error) { return atsErrorResponse(error, "Could not create the recruitment task."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "tasks");
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "tasks", 60)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    if (!isUuid(body.task_id) || !STATUSES.has(body.status)) return NextResponse.json({ error: "A valid task_id and status are required." }, { status: 400 });
    const existing = await context.client.from("recruitment_tasks").select("id,application_id,status").eq("id", body.task_id).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
    if (existing.error || !existing.data) return NextResponse.json({ error: "Task was not found." }, { status: 404 });
    const { data, error } = await context.client.from("recruitment_tasks").update({ status: body.status, completed_at: body.status === "completed" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", body.task_id).select(TASK_SELECT).single();
    if (error) throw new Error(error.message);
    if (existing.data.application_id) await appendTimeline(context, { applicationId: existing.data.application_id, eventType: "task_updated", title: `Task ${String(body.status).replace("_", " ")}`, metadata: { task_id: body.task_id, previous_status: existing.data.status, status: body.status } });
    return NextResponse.json({ task: data });
  } catch (error) { return atsErrorResponse(error, "Could not update the recruitment task."); }
}
