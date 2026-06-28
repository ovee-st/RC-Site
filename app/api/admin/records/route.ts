import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ADMIN_READ_ROLES = new Set(["admin", "viewer"]);
const ADMIN_WRITE_ROLES = new Set(["admin"]);

const TABLES = new Set([
  "profiles",
  "candidates",
  "employers",
  "employees",
  "jobs",
  "applications",
  "contact_requests",
  "hiring_requests",
  "coupons",
  "transactions",
  "subscription_payment_requests",
  "employer_subscriptions"
]);

const SECTION_TABLES: Record<string, string[]> = {
  dashboard: ["profiles", "candidates", "employers", "jobs", "applications", "contact_requests", "subscription_payment_requests", "transactions", "employer_subscriptions"],
  users: ["profiles"],
  candidates: ["profiles", "candidates", "applications"],
  employers: ["profiles", "employers", "jobs", "employer_subscriptions"],
  jobs: ["jobs", "employers"],
  employees: ["profiles", "employees"],
  "contact-requests": ["contact_requests"],
  "hiring-consultations": ["hiring_requests"],
  coupons: ["coupons"],
  "subscription-payments": ["subscription_payment_requests", "employers"],
  transactions: ["transactions"]
};

const ADMIN_PAGE_SIZE = 25;

const ADMIN_SELECT_COLUMNS: Record<string, string> = {
  profiles: [
    "id",
    "created_at",
    "updated_at",
    "email",
    "full_name",
    "name",
    "role",
    "plan",
    "verified",
    "username",
    "avatar",
    "avatar_url",
    "photo_url",
    "profile_photo_url"
  ].join(", "),
  candidates: [
    "id",
    "created_at",
    "user_id",
    "name",
    "full_name",
    "phone_number",
    "email",
    "location",
    "photo_url",
    "avatar_url",
    "banner_url",
    "category",
    "categories",
    "education",
    "skills",
    "skills_array",
    "experience",
    "about",
    "career_level",
    "target_role",
    "resume_path",
    "resume_url"
  ].join(", "),
  employers: [
    "id",
    "created_at",
    "user_id",
    "company_name",
    "contact_person",
    "email",
    "phone",
    "location",
    "industry",
    "company_size",
    "about",
    "contact_number",
    "official_email",
    "monthly_needed_hiring",
    "plan_interest",
    "category",
    "role_needed",
    "required_skills",
    "number_of_positions",
    "salary_range",
    "talent_categories_role_requirements",
    "verified",
    "status",
    "plan",
    "photo_url",
    "logo_url",
    "banner_url"
  ].join(", "),
  employees: [
    "id",
    "user_id",
    "full_name",
    "email",
    "username",
    "avatar_url",
    "status",
    "department",
    "role",
    "permissions",
    "active"
  ].join(", "),
  jobs: [
    "id",
    "created_at",
    "employer_id",
    "company_name",
    "job_title",
    "job_location",
    "job_type",
    "job_level",
    "employment_type",
    "category",
    "role",
    "description",
    "requirements",
    "required_skills",
    "required_skills_array",
    "experience_level",
    "salary_range",
    "salary_min",
    "salary_max",
    "salary_hidden",
    "benefits",
    "last_date",
    "status",
    "photo_url",
    "banner_url"
  ].join(", "),
  applications: [
    "id",
    "created_at",
    "candidate_user_id",
    "candidate_id",
    "employer_id",
    "employer_user_id",
    "job_post_id",
    "job_id",
    "job_role",
    "cv_url",
    "status"
  ].join(", "),
  contact_requests: [
    "id",
    "created_at",
    "name",
    "email",
    "company",
    "subject",
    "message",
    "status"
  ].join(", "),
  hiring_requests: [
    "id",
    "created_at",
    "updated_at",
    "employer_user_id",
    "company_name",
    "contact_person",
    "email",
    "phone",
    "hiring_type",
    "positions_required",
    "hiring_volume",
    "job_location",
    "requirement_details",
    "status"
  ].join(", "),
  coupons: [
    "id",
    "created_at",
    "coupon_name",
    "code",
    "discount_type",
    "discount_percentage",
    "discount_amount",
    "active",
    "expires_at",
    "usage_limit",
    "used_count"
  ].join(", "),
  transactions: [
    "id",
    "created_at",
    "user_id",
    "user_email",
    "amount",
    "payment_method",
    "coupon_used",
    "transaction_id",
    "status"
  ].join(", "),
  subscription_payment_requests: [
    "id",
    "employer_id",
    "plan_id",
    "coupon_id",
    "coupon_code",
    "original_amount",
    "discount_amount",
    "final_amount",
    "payment_method",
    "transaction_id",
    "sender_last_3_digits",
    "payment_screenshot",
    "status",
    "submitted_at",
    "approved_at",
    "approved_by",
    "remarks",
    "created_at",
    "updated_at",
    "employers(id, user_id, company_name, email, official_email)",
    "subscription_plans(id, slug, name, billing_type, monthly_price, one_time_price, access_days)",
    "coupons(id, coupon_name, code, discount_type, discount_percentage, discount_amount, active, expires_at, usage_limit, used_count)"
  ].join(", "),
  employer_subscriptions: [
    "id",
    "employer_id",
    "employer_user_id",
    "plan_id",
    "status",
    "billing_cycle",
    "starts_at",
    "ends_at",
    "renews_at",
    "cancelled_at",
    "start_date",
    "expiry_date",
    "created_at",
    "updated_at",
    "employers(id, user_id, company_name, email, official_email)",
    "subscription_plans(id, slug, name, description, billing_type, job_limit, candidate_view_limit, ai_credit_limit, recruiter_limit, monthly_price, one_time_price, access_days, is_active, display_order)"
  ].join(", ")
};

function missingColumnFromError(message?: string) {
  if (!message) return null;
  return (
    message.match(/Could not find the '([^']+)' column/i)?.[1] ||
    message.match(/column "?[a-zA-Z0-9_]+\.([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    message.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    null
  );
}

function removeColumn(selectText: string, missingColumn: string) {
  return selectText
    .split(",")
    .map((column) => column.trim())
    .filter((column) => column && column !== missingColumn)
    .join(", ");
}

type SupabaseQueryError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

class AdminRecordsQueryError extends Error {
  table: string;
  select: string;
  details: string;
  hint: string;
  code: string;
  rawError: unknown;

  constructor(table: string, select: string, error: SupabaseQueryError) {
    super(error.message || "Could not load admin records.");
    this.name = "AdminRecordsQueryError";
    this.table = table;
    this.select = select;
    this.details = error.details || "";
    this.hint = error.hint || "";
    this.code = error.code || "";
    this.rawError = error;
  }
}

function createAdminRecordsErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not load admin records.";

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Could not load admin records." }, { status: 403 });
  }

  if (error instanceof AdminRecordsQueryError) {
    return NextResponse.json({
      error: error.message,
      table: error.table,
      select: error.select,
      details: error.details,
      hint: error.hint,
      code: error.code
    }, { status: 403 });
  }

  const maybeError = error as SupabaseQueryError | null;
  return NextResponse.json({
    error: message,
    details: maybeError?.details || "",
    hint: maybeError?.hint || "",
    code: maybeError?.code || ""
  }, { status: 403 });
}

function sanitizePatch(patch: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(patch).filter(([key]) => !["id", "created_at"].includes(key))
  );
}

function createServerSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public credentials are missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function resolveAdminUser(
  adminClient: ReturnType<typeof createServerSupabaseClient>,
  token: string,
  refreshToken = ""
) {
  if (token) {
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (!authError && authData.user) return authData.user;
  }

  if (!refreshToken) {
    throw new Error("Invalid admin session.");
  }

  const anonClient = createServerSupabaseAnonClient();
  const attempts = [];

  if (token) {
    attempts.push(() => anonClient.auth.setSession({
      access_token: token,
      refresh_token: refreshToken
    }));
  }

  attempts.push(() => anonClient.auth.refreshSession({
    refresh_token: refreshToken
  }));

  for (const attempt of attempts) {
    const { data, error } = await attempt();
    const resolvedToken = data.session?.access_token || "";
    const resolvedUser = data.user || data.session?.user || null;

    if (error || !resolvedUser) continue;
    if (!resolvedToken) return resolvedUser;

    const { data: verifiedUser, error: verifiedUserError } = await adminClient.auth.getUser(resolvedToken);
    if (!verifiedUserError && verifiedUser.user) return verifiedUser.user;

    return resolvedUser;
  }

  throw new Error("Invalid admin session.");
}

async function requireAdminRole(token: string, refreshToken = "", write = false) {
  if (!token && !refreshToken) throw new Error("Missing admin session token.");
  const adminClient = createServerSupabaseClient();
  const adminUser = await resolveAdminUser(adminClient, token, refreshToken);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", adminUser.id)
    .maybeSingle();

  const role = String(profile?.role || "");
  const allowedRoles = write ? ADMIN_WRITE_ROLES : ADMIN_READ_ROLES;
  if (!allowedRoles.has(role)) {
    throw new Error(write ? "Only admins can edit records." : "Only admins can load records.");
  }

  return adminClient;
}

function getBodyToken(body: Record<string, unknown>) {
  return String(body.admin_token || body.adminToken || body.token || "").trim();
}

function getBodyRefreshToken(body: Record<string, unknown>) {
  return String(body.admin_refresh_token || body.adminRefreshToken || body.refresh_token || body.refreshToken || "").trim();
}

function getRequestedTables(section: string, requestedTableText = "") {
  const requestedTables = requestedTableText
    .split(",")
    .map((table) => table.trim())
    .filter(Boolean);

  return (requestedTables.length ? requestedTables : SECTION_TABLES[section] || [])
    .filter((table) => TABLES.has(table));
}

function getTimingMetricName(table: string) {
  const names: Record<string, string> = {
    employer_subscriptions: "subscriptions",
    subscription_payment_requests: "payment-requests"
  };
  return (names[table] || table).replace(/_/g, "-");
}

function formatServerTiming(timings: Array<{ table: string; duration: number }>, totalDuration: number) {
  const tableTimings = timings.map(({ table, duration }) => (
    `${getTimingMetricName(table)};dur=${duration.toFixed(1)}`
  ));
  return [`admin-db;dur=${totalDuration.toFixed(1)}`, ...tableTimings].join(", ");
}

async function loadRecords(token: string, refreshToken: string, section: string, requestedTableText = "") {
  const startedAt = performance.now();
  const tables = getRequestedTables(section, requestedTableText);

  if (!tables.length) {
    return NextResponse.json({ error: "No valid admin tables requested." }, { status: 400 });
  }

  const adminClient = await requireAdminRole(token, refreshToken);
  const timings: Array<{ table: string; duration: number }> = [];
  const entries = await Promise.all(
    tables.map(async (table) => {
      const queryStartedAt = performance.now();
      const rows = await safeSelect(adminClient, table);
      const duration = performance.now() - queryStartedAt;
      timings.push({ table, duration });
      console.info(`[admin-records] ${table} query completed in ${duration.toFixed(1)}ms (${rows.length} rows)`);
      return [table, rows] as const;
    })
  );

  const totalDuration = performance.now() - startedAt;
  const response = NextResponse.json({ ok: true, records: Object.fromEntries(entries) });
  response.headers.set("Server-Timing", formatServerTiming(timings, totalDuration));
  return response;
}

async function safeSelect(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string) {
  let columns = ADMIN_SELECT_COLUMNS[table] || "id";
  const orderColumn = table === "employer_subscriptions" ? "updated_at" : table === "subscription_payment_requests" ? "submitted_at" : "created_at";
  let useOrdering = true;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    let query = adminClient
      .from(table)
      .select(columns)
      .range(0, ADMIN_PAGE_SIZE - 1);
    if (useOrdering) query = query.order(orderColumn, { ascending: false });
    const { data, error } = await query;

    if (!error) return data || [];

    const missingColumn = missingColumnFromError(error.message);
    if (missingColumn === orderColumn) {
      console.warn("[admin-records] retrying without missing order column", {
        table,
        select: columns,
        orderColumn,
        rawError: error
      });
      useOrdering = false;
      continue;
    }
    if (!missingColumn || !columns.includes(missingColumn)) {
      console.error("[admin-records] Supabase select failed", {
        table,
        select: columns,
        rawError: error
      });
      throw new AdminRecordsQueryError(table, columns, error);
    }
    console.warn("[admin-records] retrying without missing select column", {
      table,
      select: columns,
      missingColumn,
      rawError: error
    });
    columns = removeColumn(columns, missingColumn);
    if (!columns) return [];
  }

  return [];
}

async function safeUpdate(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string, id: string, patch: Record<string, unknown>) {
  let currentPatch = sanitizePatch(patch);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await adminClient
      .from(table)
      .update(currentPatch)
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (!error && data) return { ...currentPatch, ...data };
    if (!error) throw new Error(`The ${table} record was not found.`);

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn || !(missingColumn in currentPatch)) throw error;
    const { [missingColumn]: _removed, ...rest } = currentPatch;
    currentPatch = rest;
  }

  throw new Error(`Could not update ${table}.`);
}

async function safeInsert(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string, patch: Record<string, unknown>) {
  let currentPatch = sanitizePatch(patch);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await adminClient
      .from(table)
      .insert(currentPatch)
      .select("id")
      .maybeSingle();

    if (!error) return { ...currentPatch, ...(data || {}) };

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn || !(missingColumn in currentPatch)) throw error;
    const { [missingColumn]: _removed, ...rest } = currentPatch;
    currentPatch = rest;
  }

  throw new Error(`Could not create ${table} record.`);
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || "";
  const tables = searchParams.get("tables") || "";

  try {
    return await loadRecords(token, "", section, tables);
  } catch (error) {
    return createAdminRecordsErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || getBodyToken(body);
  const refreshToken = getBodyRefreshToken(body);
  const action = String(body.action || "").trim();
  if (action === "list") {
    try {
      return await loadRecords(token, refreshToken, String(body.section || ""), String(body.tables || ""));
    } catch (error) {
      return createAdminRecordsErrorResponse(error);
    }
  }

  const table = String(body.table || "").trim();
  const patch = (body.patch || body.record || {}) as Record<string, unknown>;

  if (!TABLES.has(table)) {
    return NextResponse.json({ error: "Valid table is required." }, { status: 400 });
  }

  try {
    const adminClient = await requireAdminRole(token, refreshToken, true);
    const record = await safeInsert(adminClient, table, patch);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create admin record." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || getBodyToken(body);
  const refreshToken = getBodyRefreshToken(body);
  const table = String(body.table || "").trim();
  const id = String(body.id || "").trim();
  const patch = (body.patch || {}) as Record<string, unknown>;

  if (!TABLES.has(table) || !id) {
    return NextResponse.json({ error: "Valid table and id are required." }, { status: 400 });
  }

  try {
    const adminClient = await requireAdminRole(token, refreshToken, true);
    const record = await safeUpdate(adminClient, table, id, patch);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update admin record." }, { status: 400 });
  }
}
