import { performance } from "node:perf_hooks";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  aggregateFeatureAdoption,
  buildFunnel,
  clampPageSize,
  uniqueActiveUsers,
  type OperationsView,
  type ProductEventRow
} from "@/lib/operationsIntelligence";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
type AdminContext = { client: SupabaseClient; user: User; role: string };
type QueryResult<T> = { rows: T[]; count: number; unavailable?: string; durationMs: number };

const ADMIN_READ_ROLES = new Set(["admin", "viewer"]);
const WRITE_VIEWS = new Set<OperationsView>(["beta", "errors", "notifications", "releases", "feedback"]);
const VIEWS = new Set<OperationsView>([
  "overview", "analytics", "beta", "support", "health", "ai", "audit",
  "users", "errors", "notifications", "releases", "feedback"
]);

const CANDIDATE_FUNNEL = [
  { event: "page_view", label: "Visit" },
  { event: "candidate_registration", label: "Register" },
  { event: "profile_completed", label: "Complete profile" },
  { event: "resume_upload", label: "Upload resume" },
  { event: "job_application", label: "Apply" },
  { event: "interview_invitation", label: "Interview" },
  { event: "offer_received", label: "Offer" }
];

const EMPLOYER_FUNNEL = [
  { event: "employer_registration", label: "Register" },
  { event: "company_profile_completed", label: "Company profile" },
  { event: "job_post_created", label: "Post job" },
  { event: "candidate_received", label: "Receive candidates" },
  { event: "interview_invitation", label: "Interview" },
  { event: "candidate_hired", label: "Hire" }
];

function jsonError(error: string, status: number, correlationId: string, details?: string) {
  return NextResponse.json({ ok: false, error, correlationId, ...(details && process.env.NODE_ENV !== "production" ? { details } : {}) }, { status });
}

function correlationId(request: Request) {
  return request.headers.get("x-correlation-id") || crypto.randomUUID();
}

function isMissingRelation(error: { code?: string; message?: string } | null) {
  return Boolean(error && (["42P01", "PGRST205"].includes(error.code || "") || /does not exist|schema cache/i.test(error.message || "")));
}

async function requireAdmin(request: Request, write = false): Promise<AdminContext | NextResponse> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return jsonError("Authentication is required.", 401, correlationId(request));
  try {
    const client = createServerSupabaseClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return jsonError("Invalid session.", 401, correlationId(request));
    const profile = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = String(profile.data?.role || data.user.user_metadata?.role || "").toLowerCase();
    if (!ADMIN_READ_ROLES.has(role) || (write && role !== "admin")) {
      return jsonError(write ? "Admin write access is required." : "Admin access is required.", 403, correlationId(request));
    }
    return { client, user: data.user, role };
  } catch (error) {
    return jsonError("Operations service is unavailable.", 503, correlationId(request), error instanceof Error ? error.message : undefined);
  }
}

async function listRows<T extends Row>(
  client: SupabaseClient,
  table: string,
  columns: string,
  page: number,
  pageSize: number,
  orderColumn = "created_at",
  filters?: (query: any) => any
): Promise<QueryResult<T>> {
  const started = performance.now();
  let query = client.from(table).select(columns, { count: "exact" });
  if (filters) query = filters(query);
  const from = (page - 1) * pageSize;
  const result = await query.order(orderColumn, { ascending: false }).range(from, from + pageSize - 1);
  if (result.error) {
    if (isMissingRelation(result.error)) return { rows: [], count: 0, unavailable: result.error.message, durationMs: Math.round(performance.now() - started) };
    throw new Error(`${table}: ${result.error.message}`);
  }
  return { rows: (result.data || []) as unknown as T[], count: result.count || 0, durationMs: Math.round(performance.now() - started) };
}

async function countRows(
  client: SupabaseClient,
  table: string,
  filters?: (query: any) => any
) {
  const started = performance.now();
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (filters) query = filters(query);
  const result = await query;
  if (result.error) {
    if (isMissingRelation(result.error)) return { count: 0, unavailable: result.error.message, durationMs: Math.round(performance.now() - started) };
    throw new Error(`${table}: ${result.error.message}`);
  }
  return { count: result.count || 0, durationMs: Math.round(performance.now() - started) };
}

function startOfDay() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

async function loadEvents(client: SupabaseClient, since = daysAgo(30), limit = 10_000) {
  const started = performance.now();
  const result = await client
    .from("platform_product_events")
    .select("id,user_id,anonymous_id,event_name,page_path,role,session_id,duration_ms,completed,properties,occurred_at")
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (result.error) {
    if (isMissingRelation(result.error)) return { rows: [] as ProductEventRow[], unavailable: result.error.message, durationMs: Math.round(performance.now() - started) };
    throw new Error(`platform_product_events: ${result.error.message}`);
  }
  return { rows: (result.data || []) as ProductEventRow[], durationMs: Math.round(performance.now() - started) };
}

async function overview(client: SupabaseClient) {
  const today = startOfDay();
  const [events, candidates, employers, recruiters, jobsToday, jobsFilled, applications, interviews, offers, ai, resumes, careerVisits] = await Promise.all([
    loadEvents(client),
    countRows(client, "profiles", (query) => query.eq("role", "candidate").gte("created_at", today)),
    countRows(client, "profiles", (query) => query.eq("role", "employer").gte("created_at", today)),
    countRows(client, "recruitment_team_members", (query) => query.eq("status", "active")),
    countRows(client, "jobs", (query) => query.gte("created_at", today)),
    countRows(client, "jobs", (query) => query.in("status", ["filled", "hired", "closed"])),
    countRows(client, "applications"),
    countRows(client, "recruitment_interviews"),
    countRows(client, "recruitment_offers"),
    countRows(client, "ai_observability_events"),
    countRows(client, "candidates", (query) => query.not("resume_path", "is", null)),
    countRows(client, "career_page_events", (query) => query.eq("event_type", "view"))
  ]);
  const dayEvents = events.rows.filter((event) => event.occurred_at >= daysAgo(1));
  const weekEvents = events.rows.filter((event) => event.occurred_at >= daysAgo(7));
  const unavailable = [events, candidates, employers, recruiters, jobsToday, jobsFilled, applications, interviews, offers, ai, resumes, careerVisits]
    .flatMap((result) => "unavailable" in result && result.unavailable ? [result.unavailable] : []);
  return {
    metrics: [
      { key: "dau", label: "Daily Active Users", value: uniqueActiveUsers(dayEvents) },
      { key: "wau", label: "Weekly Active Users", value: uniqueActiveUsers(weekEvents) },
      { key: "mau", label: "Monthly Active Users", value: uniqueActiveUsers(events.rows) },
      { key: "candidates", label: "New Candidate Registrations", value: candidates.count },
      { key: "employers", label: "New Employer Registrations", value: employers.count },
      { key: "recruiters", label: "Active Recruiters", value: recruiters.count },
      { key: "jobs_today", label: "Jobs Posted Today", value: jobsToday.count },
      { key: "jobs_filled", label: "Jobs Filled", value: jobsFilled.count },
      { key: "applications", label: "Applications Submitted", value: applications.count },
      { key: "interviews", label: "Interview Invitations", value: interviews.count },
      { key: "offers", label: "Offers Sent", value: offers.count },
      { key: "ai", label: "AI Analyses Performed", value: ai.count },
      { key: "resumes", label: "Resume Uploads", value: resumes.count },
      { key: "career_visits", label: "Career Page Visits", value: careerVisits.count }
    ],
    candidateFunnel: buildFunnel(events.rows, CANDIDATE_FUNNEL),
    employerFunnel: buildFunnel(events.rows, EMPLOYER_FUNNEL),
    unavailable
  };
}

async function health(client: SupabaseClient) {
  const check = async (name: string, action: () => Promise<void>) => {
    const started = performance.now();
    try {
      await Promise.race([action(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timed out")), 4_000))]);
      return { name, status: "healthy", latencyMs: Math.round(performance.now() - started) };
    } catch (error) {
      return { name, status: "unhealthy", latencyMs: Math.round(performance.now() - started), message: error instanceof Error ? error.message : "Check failed" };
    }
  };
  const checks = await Promise.all([
    check("Database", async () => { const result = await client.from("profiles").select("id", { count: "exact", head: true }); if (result.error) throw new Error(result.error.message); }),
    check("Storage", async () => { const result = await client.storage.listBuckets(); if (result.error) throw new Error(result.error.message); }),
    check("Authentication", async () => { const result = await client.auth.admin.listUsers({ page: 1, perPage: 1 }); if (result.error) throw new Error(result.error.message); }),
    check("Background jobs", async () => { const result = await client.from("platform_background_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "retrying"]); if (result.error) throw new Error(result.error.message); })
  ]);
  checks.push({
    name: "AI provider",
    status: process.env.OPENAI_API_KEY ? "healthy" : "degraded",
    latencyMs: 0,
    ...(!process.env.OPENAI_API_KEY ? { message: "Deterministic fallbacks active" } : {})
  });
  return { checks, checkedAt: new Date().toISOString() };
}

function timingsHeader(timings: Array<{ name: string; durationMs: number }>) {
  return timings.map((timing) => `${timing.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase()};dur=${timing.durationMs}`).join(", ");
}

function paginated(rows: Row[], count: number, page: number, pageSize: number, unavailable?: string) {
  return { rows, pagination: { page, pageSize, count, pages: Math.ceil(count / pageSize) }, ...(unavailable ? { unavailable } : {}) };
}

function csvValue(value: unknown) {
  const serialized = value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return `"${serialized.replaceAll('"', '""')}"`;
}

function csvResponse(rows: Row[], filename: string) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const csv = [keys.map(csvValue).join(","), ...rows.map((row) => keys.map((key) => csvValue(row[key])).join(","))].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Cache-Control": "private, no-store"
    }
  });
}

export async function GET(request: Request) {
  const id = correlationId(request);
  const context = await requireAdmin(request);
  if (context instanceof NextResponse) return context;
  const { searchParams } = new URL(request.url);
  const requestedView = String(searchParams.get("view") || "overview") as OperationsView;
  const view = VIEWS.has(requestedView) ? requestedView : "overview";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = clampPageSize(Number(searchParams.get("page_size") || 25));
  const format = searchParams.get("format");
  const timings: Array<{ name: string; durationMs: number }> = [];

  try {
    let data: Row | Row[];
    if (view === "overview") data = await overview(context.client);
    else if (view === "analytics") {
      const events = await loadEvents(context.client);
      timings.push({ name: "product-events", durationMs: events.durationMs });
      data = {
        adoption: aggregateFeatureAdoption(events.rows),
        candidateFunnel: buildFunnel(events.rows, CANDIDATE_FUNNEL),
        employerFunnel: buildFunnel(events.rows, EMPLOYER_FUNNEL),
        eventWindowDays: 30,
        eventLimit: 10_000,
        unavailable: events.unavailable
      };
    } else if (view === "health") data = await health(context.client);
    else if (view === "ai") {
      const telemetry = await listRows<Row>(context.client, "ai_observability_events", "id,user_id,task,model,latency_ms,success,fallback_used,confidence,prompt_version,cache_hit,human_override,error_code,correlation_id,created_at", page, pageSize);
      const values = telemetry.rows;
      const average = (key: string) => {
        const numbers = values.map((row) => Number(row[key])).filter(Number.isFinite);
        return numbers.length ? Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : 0;
      };
      data = {
        ...paginated(values, telemetry.count, page, pageSize, telemetry.unavailable),
        summary: {
          averageLatencyMs: average("latency_ms"),
          averageConfidence: average("confidence"),
          fallbackRate: values.length ? Math.round((values.filter((row) => row.fallback_used).length / values.length) * 100) : 0,
          failureRate: values.length ? Math.round((values.filter((row) => !row.success).length / values.length) * 100) : 0,
          cacheHitRate: values.length ? Math.round((values.filter((row) => row.cache_hit).length / values.length) * 100) : 0,
          humanOverrideRate: values.length ? Math.round((values.filter((row) => row.human_override).length / values.length) * 100) : 0
        }
      };
      timings.push({ name: "ai-observability", durationMs: telemetry.durationMs });
    } else if (view === "users") {
      const profiles = await listRows<Row>(context.client, "profiles", "id,email,full_name,name,role,plan,verified,created_at,updated_at", page, pageSize);
      const ids = profiles.rows.map((row) => String(row.id || "")).filter(Boolean);
      const [activity, aiUsage, subscriptions] = ids.length ? await Promise.all([
        context.client.from("platform_product_events").select("user_id,event_name,occurred_at").in("user_id", ids).order("occurred_at", { ascending: false }).limit(pageSize * 100),
        context.client.from("ai_observability_events").select("user_id,success,created_at").in("user_id", ids).order("created_at", { ascending: false }).limit(pageSize * 100),
        context.client.from("employer_subscriptions").select("employer_user_id,status,ends_at,expiry_date").in("employer_user_id", ids).order("created_at", { ascending: false }).limit(pageSize * 4)
      ]) : [{ data: [] }, { data: [] }, { data: [] }];
      data = paginated(profiles.rows.map((profile) => {
        const userId = String(profile.id);
        const userEvents = (activity.data || []).filter((event) => event.user_id === userId);
        const userAi = (aiUsage.data || []).filter((event) => event.user_id === userId);
        const subscription = (subscriptions.data || []).find((item) => item.employer_user_id === userId);
        return {
          ...profile,
          profile_completed: userEvents.some((event) => event.event_name === "profile_completed" || event.event_name === "company_profile_completed"),
          activity_events: userEvents.length,
          ai_analyses: userAi.length,
          last_login: userEvents.find((event) => event.event_name === "first_login")?.occurred_at || null,
          subscription_status: subscription?.status || null,
          subscription_expiry: subscription?.ends_at || subscription?.expiry_date || null,
          support_mode: "read_only"
        };
      }), profiles.count, page, pageSize, profiles.unavailable);
      timings.push({ name: "profiles", durationMs: profiles.durationMs });
    } else if (view === "beta") {
      const [invites, waitlist, memberships, configuration] = await Promise.all([
        listRows<Row>(context.client, "beta_invites", "id,code,email,intended_role,status,expires_at,max_uses,used_count,approved_at,created_at,updated_at", page, pageSize),
        listRows<Row>(context.client, "beta_waitlist", "id,email,full_name,requested_role,company_name,status,source,notes,reviewed_at,created_at,updated_at", page, pageSize),
        countRows(context.client, "beta_memberships", (query) => query.eq("status", "active")),
        context.client.from("beta_configuration").select("invite_only,waitlist_enabled,beta_ends_at,updated_at").eq("id", true).maybeSingle()
      ]);
      timings.push({ name: "beta-invites", durationMs: invites.durationMs }, { name: "beta-waitlist", durationMs: waitlist.durationMs });
      data = {
        rows: [
          ...invites.rows.map((row) => ({ ...row, record_type: "invite" })),
          ...waitlist.rows.map((row) => ({ ...row, record_type: "waitlist" }))
        ],
        pagination: { page, pageSize, count: invites.count + waitlist.count, pages: Math.max(Math.ceil(invites.count / pageSize), Math.ceil(waitlist.count / pageSize)) },
        activeMemberships: memberships.count,
        configuration: configuration.data || null,
        unavailable: [invites.unavailable, waitlist.unavailable, memberships.unavailable, configuration.error && isMissingRelation(configuration.error) ? configuration.error.message : null].filter(Boolean)
      };
    } else {
      const definitions: Record<Exclude<OperationsView, "overview" | "analytics" | "health">, { table: string; columns: string; order?: string }> = {
        beta: { table: "beta_invites", columns: "id,code,email,intended_role,status,expires_at,max_uses,used_count,approved_at,created_at,updated_at" },
        support: { table: "support_tickets", columns: "id,ticket_number,user_id,user_role,subject,category,priority,status,assigned_to,created_at,updated_at" },
        ai: { table: "ai_observability_events", columns: "id,user_id,task,model,latency_ms,success,fallback_used,confidence,prompt_version,cache_hit,human_override,error_code,correlation_id,created_at" },
        audit: { table: "platform_audit_logs", columns: "id,actor_id,action,resource_type,resource_id,outcome,correlation_id,metadata,created_at" },
        users: { table: "profiles", columns: "id,email,full_name,name,role,plan,verified,created_at,updated_at" },
        errors: { table: "platform_errors", columns: "id,source,severity,error_code,message,route,user_id,correlation_id,fingerprint,resolved_at,created_at" },
        notifications: { table: "platform_notifications", columns: "id,notification_type,severity,title,message,status,source,correlation_id,acknowledged_at,resolved_at,created_at" },
        releases: { table: "platform_releases", columns: "id,version,title,summary,release_type,status,banner_message,starts_at,ends_at,published_at,created_at,updated_at" },
        feedback: { table: "feedback_hub", columns: "id,user_id,feedback_type,category,rating,title,message,page_path,role,status,priority,assigned_to,created_at,updated_at" }
      };
      const definition = definitions[view];
      const result = await listRows<Row>(context.client, definition.table, definition.columns, page, pageSize, definition.order);
      timings.push({ name: definition.table, durationMs: result.durationMs });
      const rows = view === "errors" ? result.rows.map((row) => ({ ...row, status: row.resolved_at ? "resolved" : "open" })) : result.rows;
      data = paginated(rows, result.count, page, pageSize, result.unavailable);
      if (format === "csv") return csvResponse(result.rows, `mxvl-${view}-${new Date().toISOString().slice(0, 10)}`);
    }
    const response = NextResponse.json({ ok: true, view, data, correlationId: id, generatedAt: new Date().toISOString() });
    response.headers.set("Cache-Control", view === "health" ? "private, no-store" : "private, max-age=30, stale-while-revalidate=60");
    if (timings.length) response.headers.set("Server-Timing", timingsHeader(timings));
    return response;
  } catch (error) {
    console.error("[operations-intelligence] query failed", { view, correlationId: id, error });
    return jsonError("Could not load operations intelligence.", 500, id, error instanceof Error ? error.message : undefined);
  }
}

async function audit(context: AdminContext, action: string, resourceType: string, resourceId: string | null, correlation: string, metadata: Row = {}) {
  const result = await context.client.from("platform_audit_logs").insert({
    actor_id: context.user.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    correlation_id: correlation,
    metadata
  });
  if (result.error) console.error("[operations-intelligence] audit write failed", { action, error: result.error });
}

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const id = correlationId(request);
  const context = await requireAdmin(request, true);
  if (context instanceof NextResponse) return context;
  const body = await request.json().catch(() => null) as Row | null;
  if (!body) return jsonError("Invalid JSON body.", 400, id);
  const action = text(body.action, 60);

  try {
    if (action === "create_invite") {
      const code = text(body.code, 80).toUpperCase() || `MXVL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const row = {
        code,
        email: text(body.email, 240) || null,
        intended_role: text(body.intended_role, 40) || null,
        status: "pending",
        expires_at: text(body.expires_at, 40) || null,
        max_uses: Math.max(1, Math.min(1000, Number(body.max_uses) || 1)),
        created_by: context.user.id
      };
      const result = await context.client.from("beta_invites").insert(row).select("id,code,email,intended_role,status,expires_at,max_uses,used_count,created_at").single();
      if (result.error) throw new Error(result.error.message);
      await audit(context, "beta_invite_created", "beta_invite", result.data.id, id, { intended_role: row.intended_role });
      return NextResponse.json({ ok: true, record: result.data, correlationId: id }, { status: 201 });
    }
    if (action === "update_beta_configuration") {
      const row = {
        id: true,
        invite_only: Boolean(body.invite_only),
        waitlist_enabled: body.waitlist_enabled === undefined ? true : Boolean(body.waitlist_enabled),
        beta_ends_at: text(body.beta_ends_at, 40) || null,
        updated_by: context.user.id,
        updated_at: new Date().toISOString()
      };
      const result = await context.client.from("beta_configuration").upsert(row).select("invite_only,waitlist_enabled,beta_ends_at,updated_at").single();
      if (result.error) throw new Error(result.error.message);
      await audit(context, "beta_configuration_updated", "beta_configuration", "global", id, { invite_only: row.invite_only, waitlist_enabled: row.waitlist_enabled });
      return NextResponse.json({ ok: true, record: result.data, correlationId: id });
    }
    if (action === "create_release") {
      const row = {
        version: text(body.version, 80),
        title: text(body.title, 180),
        summary: text(body.summary, 4000),
        release_type: text(body.release_type, 40) || "product_update",
        status: text(body.status, 30) || "draft",
        banner_message: text(body.banner_message, 500) || null,
        starts_at: text(body.starts_at, 40) || null,
        ends_at: text(body.ends_at, 40) || null,
        created_by: context.user.id
      };
      if (!row.version || !row.title || !row.summary) return jsonError("Version, title, and summary are required.", 400, id);
      const result = await context.client.from("platform_releases").insert(row).select("id,version,title,summary,release_type,status,banner_message,starts_at,ends_at,created_at").single();
      if (result.error) throw new Error(result.error.message);
      await audit(context, "release_created", "platform_release", result.data.id, id, { version: row.version, status: row.status });
      return NextResponse.json({ ok: true, record: result.data, correlationId: id }, { status: 201 });
    }
    return jsonError("Unsupported operations action.", 400, id);
  } catch (error) {
    console.error("[operations-intelligence] write failed", { action, correlationId: id, error });
    return jsonError("Could not complete the operations action.", 400, id, error instanceof Error ? error.message : undefined);
  }
}

export async function PATCH(request: Request) {
  const id = correlationId(request);
  const context = await requireAdmin(request, true);
  if (context instanceof NextResponse) return context;
  const body = await request.json().catch(() => null) as Row | null;
  if (!body) return jsonError("Invalid JSON body.", 400, id);
  const view = text(body.view, 40) as OperationsView;
  const recordId = text(body.id, 80);
  const status = text(body.status, 40);
  const recordType = text(body.record_type, 30);
  if (!WRITE_VIEWS.has(view) || !recordId || !status) return jsonError("Valid view, id, and status are required.", 400, id);
  const tableByView: Record<string, string> = {
    beta: "beta_invites",
    errors: "platform_errors",
    notifications: "platform_notifications",
    releases: "platform_releases",
    feedback: "feedback_hub"
  };
  const table = view === "beta" && recordType === "waitlist" ? "beta_waitlist" : tableByView[view];
  const allowedStatus: Record<string, Set<string>> = {
    beta: recordType === "waitlist" ? new Set(["waiting", "approved", "invited", "declined"]) : new Set(["pending", "approved", "used", "expired", "revoked"]),
    errors: new Set(["open", "resolved"]),
    notifications: new Set(["open", "acknowledged", "resolved"]),
    releases: new Set(["draft", "scheduled", "published", "completed", "cancelled"]),
    feedback: new Set(["new", "reviewing", "planned", "resolved", "closed"])
  };
  if (!allowedStatus[view]?.has(status)) return jsonError("Unsupported status.", 400, id);
  const patch: Row = view === "errors"
    ? { resolved_at: status === "resolved" ? new Date().toISOString() : null, resolved_by: status === "resolved" ? context.user.id : null }
    : { status, updated_at: new Date().toISOString() };
  if (view === "beta" && status === "approved") {
    if (recordType === "waitlist") Object.assign(patch, { reviewed_by: context.user.id, reviewed_at: new Date().toISOString() });
    else Object.assign(patch, { approved_by: context.user.id, approved_at: new Date().toISOString() });
  }
  if (view === "notifications" && status === "acknowledged") Object.assign(patch, { acknowledged_by: context.user.id, acknowledged_at: new Date().toISOString() });
  if (view === "notifications" && status === "resolved") Object.assign(patch, { resolved_at: new Date().toISOString() });
  if (view === "releases" && status === "published") Object.assign(patch, { published_at: new Date().toISOString() });
  const result = await context.client.from(table).update(patch).eq("id", recordId).select("id,status").single();
  if (result.error) return jsonError("Could not update the operational record.", 400, id, result.error.message);
  await audit(context, `${view}_status_changed`, table, recordId, id, { status });
  return NextResponse.json({ ok: true, record: result.data, correlationId: id });
}
