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
  "coupons",
  "transactions",
  "subscription_payment_requests"
]);

const SECTION_TABLES: Record<string, string[]> = {
  dashboard: ["profiles", "candidates", "employers", "jobs", "applications", "contact_requests", "subscription_payment_requests", "transactions"],
  users: ["profiles"],
  candidates: ["profiles", "candidates", "applications"],
  employers: ["profiles", "employers", "jobs"],
  jobs: ["jobs", "employers"],
  employees: ["profiles", "employees"],
  "contact-requests": ["contact_requests"],
  coupons: ["coupons"],
  "subscription-payments": ["subscription_payment_requests", "employers"],
  transactions: ["transactions"]
};

function missingColumnFromError(message?: string) {
  if (!message) return null;
  return (
    message.match(/Could not find the '([^']+)' column/i)?.[1] ||
    message.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    null
  );
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

async function loadRecords(token: string, refreshToken: string, section: string, requestedTableText = "") {
  const tables = getRequestedTables(section, requestedTableText);

  if (!tables.length) {
    return NextResponse.json({ error: "No valid admin tables requested." }, { status: 400 });
  }

  const adminClient = await requireAdminRole(token, refreshToken);
  const entries = await Promise.all(
    tables.map(async (table) => [table, await safeSelect(adminClient, table)] as const)
  );

  return NextResponse.json({ ok: true, records: Object.fromEntries(entries) });
}

async function safeSelect(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string) {
  const { data, error } = await adminClient
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!error) return data || [];

  if (/created_at|column|does not exist|schema cache/i.test(error.message || "")) {
    const fallback = await adminClient.from(table).select("*").limit(1000);
    if (!fallback.error) return fallback.data || [];
  }

  throw error;
}

async function safeUpdate(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string, id: string, patch: Record<string, unknown>) {
  let currentPatch = sanitizePatch(patch);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await adminClient
      .from(table)
      .update(currentPatch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error) return data || { id, ...currentPatch };

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
      .select("*")
      .maybeSingle();

    if (!error) return data || currentPatch;

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load admin records." }, { status: 403 });
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
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load admin records." }, { status: 403 });
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
