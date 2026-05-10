import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_ROLES = new Set(["admin"]);
const PLATFORM_ROLES = new Set(["admin", "viewer", "employer", "employee", "candidate"]);

function employeeUsername(email: string, id: string) {
  const base = email.split("@")[0]?.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "employee";
  return `${base}-${id.slice(0, 6)}`;
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

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
    return NextResponse.json({ error: "Only admins can change user roles." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = String(body.user_id || "").trim();
  const role = String(body.role || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || body.name || email.split("@")[0] || "RC User").trim();

  if (!userId || !PLATFORM_ROLES.has(role)) {
    return NextResponse.json({ error: "Valid user id and role are required." }, { status: 400 });
  }

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("email, full_name, name")
    .eq("id", userId)
    .maybeSingle();

  const resolvedEmail = email || String(existingProfile?.email || "").toLowerCase();
  const resolvedName = fullName || existingProfile?.full_name || existingProfile?.name || "RC User";

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: {
      role,
      full_name: resolvedName,
      name: resolvedName
    }
  });

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: userId,
      email: resolvedEmail,
      full_name: resolvedName,
      name: resolvedName,
      role,
      plan: role === "admin" || role === "viewer" || role === "employee" ? "Internal" : undefined
    }, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (role === "employee") {
    const { error: employeeError } = await adminClient.from("employees").upsert({
      user_id: userId,
      full_name: resolvedName,
      email: resolvedEmail,
      username: employeeUsername(resolvedEmail || resolvedName, userId),
      department: body.department || "Support",
      permissions: body.permissions || ["tickets:read", "tickets:update", "messages:create"],
      active: true
    }, { onConflict: "user_id" });

    if (employeeError) {
      return NextResponse.json({ error: employeeError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, profile });
}
