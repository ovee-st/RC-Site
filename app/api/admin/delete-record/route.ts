import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ADMIN_ROLES = new Set(["admin"]);
const CASCADE_USER_TABLES = new Set(["profiles", "candidates", "employers", "employees"]);
const RECORD_TABLES = new Set([
  "profiles",
  "candidates",
  "employers",
  "employees",
  "jobs",
  "contact_requests",
  "coupons",
  "transactions",
  "support_tickets"
]);

async function safeDelete(adminClient: ReturnType<typeof createServerSupabaseClient>, table: string, column: string, value?: string | null) {
  if (!value) return;
  const { error } = await adminClient.from(table).delete().eq(column, value);
  if (error && !/column|does not exist|schema cache|relationship/i.test(error.message)) {
    throw error;
  }
}

async function findProfileIdByEmail(adminClient: ReturnType<typeof createServerSupabaseClient>, email?: string | null) {
  if (!email) return null;
  const { data } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return data?.id || null;
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing admin session token." }, { status: 401 });
  }

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
  }

  const { data: requester } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!ADMIN_ROLES.has(String(requester?.role || ""))) {
    return NextResponse.json({ error: "Only admins can delete records." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const table = String(body.table || "").trim();
  const id = String(body.id || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!RECORD_TABLES.has(table) || !id) {
    return NextResponse.json({ error: "Valid table and id are required." }, { status: 400 });
  }

  let userId: string | null = null;
  let resolvedEmail = email || null;

  if (CASCADE_USER_TABLES.has(table)) {
    const { data: row } = await adminClient
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    userId = String(row?.user_id || row?.id || id || "").trim() || null;
    resolvedEmail = resolvedEmail || String(row?.email || "").toLowerCase() || null;

    if (!userId && resolvedEmail) {
      userId = await findProfileIdByEmail(adminClient, resolvedEmail);
    }

    if (userId === authData.user.id) {
      return NextResponse.json({ error: "Admins cannot delete their own active session account." }, { status: 400 });
    }

    await safeDelete(adminClient, "applications", "candidate_id", userId);
    await safeDelete(adminClient, "applications", "employer_id", userId);
    await safeDelete(adminClient, "jobs", "employer_id", userId);
    await safeDelete(adminClient, "support_tickets", "user_id", userId);
    await safeDelete(adminClient, "ticket_messages", "sender_id", userId);
    await safeDelete(adminClient, "ticket_activity", "actor_id", userId);
    await safeDelete(adminClient, "employees", "id", userId);
    await safeDelete(adminClient, "employees", "user_id", userId);
    await safeDelete(adminClient, "candidates", "user_id", userId);
    await safeDelete(adminClient, "employers", "user_id", userId);

    if (resolvedEmail) {
      await safeDelete(adminClient, "candidates", "email", resolvedEmail);
      await safeDelete(adminClient, "employers", "email", resolvedEmail);
      await safeDelete(adminClient, "profiles", "email", resolvedEmail);
    }

    await safeDelete(adminClient, "profiles", "id", userId);

    if (userId) {
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthError && !/not found/i.test(deleteAuthError.message)) {
        return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, deleted: { table, id, user_id: userId } });
  }

  await safeDelete(adminClient, table, "id", id);
  return NextResponse.json({ ok: true, deleted: { table, id } });
}
