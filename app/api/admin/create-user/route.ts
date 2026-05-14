import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const INTERNAL_ROLES = new Set(["admin", "super_admin", "viewer", "employee", "support_agent", "support_senior", "support_manager"]);

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Admin service role is not configured on this deployment." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing admin session token." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
  }

  const { data: requester, error: requesterError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (requesterError || !ADMIN_ROLES.has(String(requester?.role || ""))) {
    return NextResponse.json({ error: "Only admins can create internal users." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.full_name || body.name || "").trim();
  const role = INTERNAL_ROLES.has(String(body.role)) ? String(body.role) : "viewer";

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: fullName,
      name: fullName
    }
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message || "Could not create user." }, { status: 400 });
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: created.user.id,
    email,
    full_name: fullName,
    name: fullName,
    role,
    plan: "Internal",
    verified: true
  }, { onConflict: "id" });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (role === "employee" || role === "support_agent" || role === "support_senior" || role === "support_manager") {
    const employeePayload = {
      id: created.user.id,
      user_id: created.user.id,
      full_name: fullName,
      email,
      avatar_url: null,
      username: `employee_${String(Date.now()).slice(-6)}`,
      department: body.department || "Support",
      permissions: body.permissions || ["tickets:read", "tickets:update", "messages:create"],
      active: true,
      is_active: true,
      role
    };

    const employeeWrite = await adminClient.from("employees").upsert(employeePayload, { onConflict: "id" });
    if (employeeWrite.error && /user_id|permissions|active/i.test(employeeWrite.error.message)) {
      const { user_id: _userId, permissions: _permissions, active: _active, ...strictEmployeePayload } = employeePayload;
      await adminClient.from("employees").upsert(strictEmployeePayload, { onConflict: "id" });
    }
  }

  return NextResponse.json({ ok: true, user: { id: created.user.id, email, full_name: fullName, role } });
}
