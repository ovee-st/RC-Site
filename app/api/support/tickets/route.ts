import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeSupportRole } from "@/lib/support";

const AGENT_ROLES = new Set(["admin", "employee"]);

async function getRequester(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Missing session token." }, { status: 401 }) };

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, username")
    .eq("id", authData.user.id)
    .maybeSingle();

  return { adminClient, user: authData.user, profile };
}

export async function GET(request: Request) {
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const role = String(context.profile?.role || "");
  let query = context.adminClient.from("support_tickets").select("*").order("created_at", { ascending: false });

  if (!AGENT_ROLES.has(role)) {
    query = query.eq("user_id", context.user.id);
  } else if (role === "employee") {
    query = query.or(`assigned_employee_id.is.null,assigned_employee_id.eq.${context.user.id}`);
  }

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request: Request) {
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const body = await request.json().catch(() => ({}));
  const role = normalizeSupportRole(context.profile?.role);
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  const { data, error } = await context.adminClient
    .from("support_tickets")
    .insert({
      user_id: context.user.id,
      user_role: role,
      username: context.profile?.username || context.user.email?.split("@")[0] || context.user.id,
      subject,
      message,
      priority: body.priority || "MEDIUM",
      status: "OPEN",
      attachment_urls: body.attachment_urls || []
    })
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ticket: data });
}
