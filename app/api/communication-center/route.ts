import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { getSmartEngagement } from "@/lib/communications/smartEngagement";
import type { CommunicationContext, CommunicationItem, CommunicationRole, CommunicationSection } from "@/types/communicationCenter";

const SECTIONS = new Set<CommunicationSection>(["notifications", "messages", "interviews", "offers", "tasks", "ai-alerts", "timeline"]);
const EMPLOYER_ROLES = new Set(["employer", "employee", "recruiter", "hiring_manager", "interviewer"]);
const SUPPORT_ROLES = new Set(["support_agent", "support_senior", "support_manager"]);

type Client = ReturnType<typeof createServerSupabaseClient>;
type ApplicationRow = {
  id: string;
  job_role?: string | null;
};
type RequestContext = {
  client: Client;
  userId: string;
  role: CommunicationRole;
  workspaceOwnerId: string;
  employerId: string | null;
};

async function getContext(request: Request): Promise<RequestContext | NextResponse> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  const client = createServerSupabaseClient();
  const auth = await client.auth.getUser(token);
  if (auth.error || !auth.data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  const user = auth.data.user;
  const profile = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const rawRole = String(profile.data?.role || user.user_metadata?.role || "candidate").toLowerCase();
  const membership = await client.from("recruitment_team_members").select("employer_user_id,member_role,status").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  const effectiveRole = String(membership.data?.member_role || rawRole).toLowerCase();
  const role: CommunicationRole = effectiveRole === "candidate" ? "candidate" : effectiveRole === "admin" || effectiveRole === "viewer" ? "admin" : SUPPORT_ROLES.has(effectiveRole) ? "support" : EMPLOYER_ROLES.has(effectiveRole) ? "employer" : "candidate";
  const workspaceOwnerId = membership.data?.employer_user_id || user.id;
  const employer = role === "employer" || role === "admin" ? await client.from("employers").select("id").eq("user_id", workspaceOwnerId).limit(1).maybeSingle() : { data: null };
  return { client, userId: user.id, role, workspaceOwnerId, employerId: employer.data?.id || null };
}

async function getApplications(context: RequestContext) {
  if (context.role === "candidate") {
    const result = await context.client.from("applications").select("id,candidate_user_id,employer_user_id,employer_id,job_role,status,created_at").or(`candidate_user_id.eq.${context.userId},candidate_id.eq.${context.userId}`).order("created_at", { ascending: false }).limit(500);
    if (result.error) throw new Error(result.error.message);
    return result.data || [];
  }
  if (context.role === "employer" || context.role === "admin") {
    const filters = [`employer_user_id.eq.${context.workspaceOwnerId}`];
    if (context.employerId) filters.push(`employer_id.eq.${context.employerId}`);
    const result = await context.client.from("applications").select("id,candidate_user_id,employer_user_id,employer_id,job_role,status,created_at").or(filters.join(",")).order("created_at", { ascending: false }).limit(500);
    if (result.error) throw new Error(result.error.message);
    return result.data || [];
  }
  return [];
}

function toItem(input: {
  id: string;
  section: CommunicationSection;
  category: string;
  title: string;
  summary: string;
  timestamp?: string | null;
  status?: string | null;
  applicationId?: string | null;
  role: CommunicationRole;
  href?: string | null;
  metadata?: Record<string, unknown> | null;
}): CommunicationItem {
  const guidance = getSmartEngagement({ role: input.role, category: input.category, title: input.title, summary: input.summary, status: input.status, href: input.href });
  const storedPriority = String(input.metadata?.priority || "");
  const priority = ["low", "medium", "high", "urgent"].includes(storedPriority) ? storedPriority as CommunicationItem["priority"] : guidance.priority;
  return {
    id: input.id,
    section: input.section,
    category: input.category,
    title: input.title,
    summary: input.summary,
    whyItMatters: guidance.whyItMatters,
    signal: guidance.signal,
    priority,
    status: input.status || "active",
    timestamp: input.timestamp || new Date().toISOString(),
    applicationId: input.applicationId,
    recommendedAction: guidance.recommendedAction,
    metadata: input.metadata || {}
  };
}

function pageItems(items: CommunicationItem[], page: number, pageSize: number) {
  const sorted = items.sort((a, b) => Number(Boolean(b.metadata?.pinned)) - Number(Boolean(a.metadata?.pinned)) || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const from = (page - 1) * pageSize;
  return { items: sorted.slice(from, from + pageSize), total: sorted.length, hasMore: from + pageSize < sorted.length };
}

function contextsFrom(applications: ApplicationRow[]): CommunicationContext[] {
  return applications.map((application) => ({ applicationId: application.id, label: application.job_role || `Application ${application.id.slice(0, 8)}` }));
}

function filterSearch(items: CommunicationItem[], query: string) {
  if (!query) return items;
  const normalized = query.toLowerCase();
  return items.filter((item) => `${item.title} ${item.summary} ${item.category} ${item.status}`.toLowerCase().includes(normalized));
}

async function loadSection(context: RequestContext, section: CommunicationSection) {
  const applications = await getApplications(context);
  const applicationIds = applications.map((row) => row.id);
  const appMap = new Map(applications.map((row) => [row.id, row]));
  const candidate = context.role === "candidate";

  if (section === "notifications" || section === "ai-alerts") {
    const recruitment = await context.client.from("recruitment_notifications").select("id,application_id,notification_type,title,message,metadata,read_at,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200);
    const generic = await context.client.from("notifications").select("id,type,title,message,is_read,created_at,href,redirect_url").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200);
    const items: CommunicationItem[] = [];
    for (const row of recruitment.data || []) items.push(toItem({ id: `recruitment:${row.id}`, section: String(row.notification_type).toLowerCase().includes("ai") ? "ai-alerts" : "notifications", category: row.notification_type, title: row.title, summary: row.message, timestamp: row.created_at, status: row.metadata?.archived ? "archived" : row.read_at ? "read" : "unread", applicationId: row.application_id, role: context.role, metadata: { ...(row.metadata || {}), source: "recruitment", sourceId: row.id } }));
    for (const row of generic.data || []) items.push(toItem({ id: `platform:${row.id}`, section: String(row.type).toLowerCase().includes("ai") ? "ai-alerts" : "notifications", category: row.type || "system", title: row.title || "Platform update", summary: row.message || "There is a new account update.", timestamp: row.created_at, status: row.is_read ? "read" : "unread", role: context.role, href: row.href || row.redirect_url, metadata: { source: "platform", sourceId: row.id } }));
    if (section === "notifications") {
      for (const application of applications.slice(0, 30)) items.push(toItem({ id: `application:${application.id}:${application.status}`, section, category: "application", title: candidate ? `Application ${application.status || "submitted"}` : "Candidate application update", summary: candidate ? `Your application for ${application.job_role || "a role"} is currently ${application.status || "submitted"}.` : `An application for ${application.job_role || "an open role"} is currently ${application.status || "new"}.`, timestamp: application.created_at, status: "read", applicationId: application.id, role: context.role }));
    }
    return { items: items.filter((item) => item.section === section), contexts: contextsFrom(applications) };
  }

  if (section === "messages") {
    if (!applicationIds.length) return { items: [], contexts: [] };
    const communications = await context.client.from("recruitment_communications").select("id,application_id,communication_type,direction,subject,body,actor_id,recipient_ids,metadata,created_at").in("application_id", applicationIds).order("created_at", { ascending: false }).limit(300);
    const talent = await context.client.from("talent_messages").select("id,application_id,channel,direction,message_type,subject,body,status,metadata,created_at").in("application_id", applicationIds).order("created_at", { ascending: false }).limit(200);
    const items: CommunicationItem[] = [];
    for (const row of communications.data || []) items.push(toItem({ id: `communication:${row.id}`, section, category: row.communication_type, title: row.subject || `${row.communication_type.replaceAll("_", " ")} message`, summary: row.body, timestamp: row.created_at, status: Array.isArray(row.metadata?.read_by) && row.metadata.read_by.includes(context.userId) ? "read" : row.actor_id === context.userId ? "sent" : "unread", applicationId: row.application_id, role: context.role, metadata: { ...(row.metadata || {}), direction: row.direction, source: "communication", sourceId: row.id, context: appMap.get(row.application_id)?.job_role } }));
    for (const row of talent.data || []) items.push(toItem({ id: `talent:${row.id}`, section, category: row.message_type || row.channel, title: row.subject || "Recruitment message", summary: row.body, timestamp: row.created_at, status: row.status || "sent", applicationId: row.application_id, role: context.role, metadata: { ...(row.metadata || {}), direction: row.direction, channel: row.channel, source: "talent" } }));
    return { items, contexts: contextsFrom(applications) };
  }

  if (section === "interviews") {
    if (!applicationIds.length) return { items: [], contexts: contextsFrom(applications) };
    const result = await context.client.from("recruitment_interviews").select("id,application_id,interview_type,status,scheduled_at,duration_minutes,timezone,meeting_link,location,agenda,updated_at").in("application_id", applicationIds).order("scheduled_at", { ascending: true }).limit(200);
    return { items: (result.data || []).map((row) => toItem({ id: `interview:${row.id}`, section, category: "interview", title: `${row.interview_type} interview`, summary: `${new Date(row.scheduled_at).toLocaleString()} - ${row.duration_minutes} minutes${row.location ? ` - ${row.location}` : ""}`, timestamp: row.scheduled_at, status: row.status, applicationId: row.application_id, role: context.role, href: candidate ? "/candidate/interview-prep" : "/employer#pipeline", metadata: { meetingLink: row.meeting_link, agenda: row.agenda, timezone: row.timezone, context: appMap.get(row.application_id)?.job_role } })), contexts: contextsFrom(applications) };
  }

  if (section === "offers") {
    if (!applicationIds.length) return { items: [], contexts: contextsFrom(applications) };
    const result = await context.client.from("recruitment_offers").select("id,application_id,status,current_version,expires_at,sent_at,viewed_at,responded_at,created_at,updated_at").in("application_id", applicationIds).order("updated_at", { ascending: false }).limit(200);
    return { items: (result.data || []).map((row) => toItem({ id: `offer:${row.id}`, section, category: "offer", title: `${appMap.get(row.application_id)?.job_role || "Employment"} offer`, summary: row.expires_at ? `Offer version ${row.current_version} - expires ${new Date(row.expires_at).toLocaleDateString()}` : `Offer version ${row.current_version}`, timestamp: row.updated_at, status: row.status, applicationId: row.application_id, role: context.role, href: candidate ? "/candidate/portal" : "/employer#pipeline", metadata: { expiresAt: row.expires_at } })), contexts: contextsFrom(applications) };
  }

  if (section === "tasks") {
    if (candidate) {
      const interviewTasks = applicationIds.length ? await context.client.from("recruitment_interviews").select("id,application_id,status,scheduled_at,interview_type").in("application_id", applicationIds).eq("status", "scheduled").order("scheduled_at").limit(50) : { data: [] };
      const offerTasks = applicationIds.length ? await context.client.from("recruitment_offers").select("id,application_id,status,expires_at,updated_at").in("application_id", applicationIds).in("status", ["sent", "viewed"]).limit(50) : { data: [] };
      const items = [
        ...(interviewTasks.data || []).map((row) => toItem({ id: `candidate-interview-task:${row.id}`, section, category: "interview preparation", title: `Prepare for ${row.interview_type} interview`, summary: `Your interview is scheduled for ${new Date(row.scheduled_at).toLocaleString()}.`, timestamp: row.scheduled_at, status: "pending", applicationId: row.application_id, role: context.role, href: "/candidate/interview-prep" })),
        ...(offerTasks.data || []).map((row) => toItem({ id: `candidate-offer-task:${row.id}`, section, category: "offer response", title: "Review active offer", summary: row.expires_at ? `Respond before ${new Date(row.expires_at).toLocaleDateString()}.` : "Review the offer details and choose your response.", timestamp: row.updated_at, status: "pending", applicationId: row.application_id, role: context.role, href: "/candidate/portal" }))
      ];
      return { items, contexts: contextsFrom(applications) };
    }
    const result = await context.client.from("recruitment_tasks").select("id,application_id,title,description,task_type,status,priority,assigned_to,due_at,completed_at,created_at,updated_at").eq("employer_user_id", context.workspaceOwnerId).order("due_at", { ascending: true, nullsFirst: false }).limit(300);
    return { items: (result.data || []).map((row) => toItem({ id: `task:${row.id}`, section, category: row.task_type || "task", title: row.title, summary: row.description || (row.due_at ? `Due ${new Date(row.due_at).toLocaleString()}` : "No due date"), timestamp: row.updated_at || row.created_at, status: row.status, applicationId: row.application_id, role: context.role, href: "/employer#pipeline", metadata: { priority: row.priority, dueAt: row.due_at, sourceId: row.id } })), contexts: contextsFrom(applications) };
  }

  if (section === "timeline") {
    if (!applicationIds.length) return { items: [], contexts: contextsFrom(applications) };
    const result = await context.client.from("application_timeline_events").select("id,application_id,event_type,title,description,actor_name,metadata,created_at").in("application_id", applicationIds).order("created_at", { ascending: false }).limit(300);
    return { items: (result.data || []).map((row) => toItem({ id: `timeline:${row.id}`, section, category: row.event_type, title: row.title, summary: row.description || `${row.actor_name || "MXVL"} recorded this recruitment event.`, timestamp: row.created_at, status: "recorded", applicationId: row.application_id, role: context.role, metadata: { ...(row.metadata || {}), actorName: row.actor_name, context: appMap.get(row.application_id)?.job_role } })), contexts: contextsFrom(applications) };
  }

  return { items: [], contexts: contextsFrom(applications) };
}

export async function GET(request: Request) {
  try {
    const context = await getContext(request);
    if (context instanceof NextResponse) return context;
    const url = new URL(request.url);
    const rawSection = url.searchParams.get("section") || "notifications";
    if (!SECTIONS.has(rawSection as CommunicationSection)) return NextResponse.json({ error: "A valid communication section is required." }, { status: 400 });
    const section = rawSection as CommunicationSection;
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(10, Math.min(50, Number(url.searchParams.get("page_size") || 25)));
    const search = String(url.searchParams.get("q") || "").trim().slice(0, 120);
    const loaded = await loadSection(context, section);
    const paged = pageItems(filterSearch(loaded.items, search), page, pageSize);
    return NextResponse.json({ section, ...paged, contexts: loaded.contexts, unreadCount: loaded.items.filter((item) => item.status === "unread").length, page });
  } catch (error) {
    console.error("[communication-center] load failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Communication Center." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getContext(request);
    if (context instanceof NextResponse) return context;
    const body = await request.json().catch(() => ({}));
    const applicationId = String(body.application_id || "");
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.body || "").trim().slice(0, 10_000);
    const applications = await getApplications(context);
    const application = applications.find((row) => row.id === applicationId);
    if (!application || !message) return NextResponse.json({ error: "A valid application and message are required." }, { status: 400 });
    const recipientId = context.role === "candidate" ? application.employer_user_id : application.candidate_user_id;
    const result = await context.client.from("recruitment_communications").insert({ application_id: applicationId, communication_type: "email", direction: context.role === "candidate" ? "inbound" : "outbound", subject: subject || null, body: message, actor_id: context.userId, recipient_ids: recipientId ? [recipientId] : [], metadata: { channel: "in_app", delivery_status: "recorded", read_by: [context.userId], sender_role: context.role } }).select("id,application_id,communication_type,direction,subject,body,actor_id,recipient_ids,metadata,created_at").single();
    if (result.error) throw new Error(result.error.message);
    await context.client.from("application_timeline_events").insert({ application_id: applicationId, event_type: "message_sent", title: "Recruitment message sent", description: subject || "In-app recruitment message", actor_id: context.userId, metadata: { communication_id: result.data.id, channel: "in_app" } });
    if (recipientId) await context.client.from("recruitment_notifications").insert({ user_id: recipientId, application_id: applicationId, notification_type: "message", title: subject || "New recruitment message", message: message.slice(0, 500), metadata: { communication_id: result.data.id } });
    return NextResponse.json({ message: result.data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not send the message." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getContext(request);
    if (context instanceof NextResponse) return context;
    const body = await request.json().catch(() => ({}));
    if (body.action === "mark_all_read") {
      const now = new Date().toISOString();
      await Promise.all([
        context.client.from("recruitment_notifications").update({ read_at: now }).eq("user_id", context.userId).is("read_at", null),
        context.client.from("notifications").update({ is_read: true }).eq("user_id", context.userId).eq("is_read", false)
      ]);
      return NextResponse.json({ updated: true });
    }
    const source = String(body.source || "");
    const sourceId = String(body.source_id || "");
    if (body.action === "mark_read" && sourceId) {
      if (source === "communication") {
        const applications = await getApplications(context);
        const applicationIds = applications.map((row) => row.id);
        if (!applicationIds.length) return NextResponse.json({ error: "Message was not found." }, { status: 404 });
        const current = await context.client.from("recruitment_communications").select("id,metadata").eq("id", sourceId).in("application_id", applicationIds).maybeSingle();
        if (current.error || !current.data) return NextResponse.json({ error: "Message was not found." }, { status: 404 });
        const metadata = current.data.metadata && typeof current.data.metadata === "object" ? current.data.metadata as Record<string, unknown> : {};
        const readBy = Array.isArray(metadata.read_by) ? metadata.read_by.filter((value): value is string => typeof value === "string") : [];
        const updated = await context.client.from("recruitment_communications").update({ metadata: { ...metadata, read_by: Array.from(new Set([...readBy, context.userId])), read_at: new Date().toISOString() } }).eq("id", sourceId);
        if (updated.error) throw new Error(updated.error.message);
        return NextResponse.json({ updated: true });
      }
      const result = source === "platform" ? await context.client.from("notifications").update({ is_read: true }).eq("id", sourceId).eq("user_id", context.userId) : await context.client.from("recruitment_notifications").update({ read_at: new Date().toISOString() }).eq("id", sourceId).eq("user_id", context.userId);
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ updated: true });
    }
    if (body.action === "update_notification" && source === "recruitment" && sourceId) {
      const current = await context.client.from("recruitment_notifications").select("id,metadata").eq("id", sourceId).eq("user_id", context.userId).maybeSingle();
      if (current.error || !current.data) return NextResponse.json({ error: "Notification was not found." }, { status: 404 });
      const metadata = current.data.metadata && typeof current.data.metadata === "object" ? current.data.metadata as Record<string, unknown> : {};
      const patch = {
        ...metadata,
        ...(typeof body.pinned === "boolean" ? { pinned: body.pinned } : {}),
        ...(typeof body.archived === "boolean" ? { archived: body.archived } : {}),
        ...(["low", "medium", "high", "urgent"].includes(body.priority) ? { priority: body.priority } : {})
      };
      const updated = await context.client.from("recruitment_notifications").update({ metadata: patch, ...(body.archived ? { read_at: new Date().toISOString() } : {}) }).eq("id", sourceId).eq("user_id", context.userId);
      if (updated.error) throw new Error(updated.error.message);
      return NextResponse.json({ updated: true });
    }
    if (body.action === "complete_task" && sourceId && context.role !== "candidate") {
      const result = await context.client.from("recruitment_tasks").update({ status: "completed", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", sourceId).eq("employer_user_id", context.workspaceOwnerId);
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ updated: true });
    }
    return NextResponse.json({ error: "A supported communication action is required." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Communication Center." }, { status: 500 });
  }
}
