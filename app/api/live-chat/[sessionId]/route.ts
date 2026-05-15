import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { canViewLiveChat } from "@/lib/liveChat";
import { isSupportStaffRole } from "@/lib/supportRoles";

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

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { sessionId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const { data: session, error } = await context.adminClient
    .from("live_chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!canViewLiveChat(context.profile?.role, context.user.id, session)) {
    return NextResponse.json({ error: "You cannot access this live chat." }, { status: 403 });
  }

  return NextResponse.json({ session });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { sessionId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "").toLowerCase();
  const role = String(context.profile?.role || "");

  const { data: session } = await context.adminClient
    .from("live_chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!canViewLiveChat(role, context.user.id, session)) {
    return NextResponse.json({ error: "You cannot update this live chat." }, { status: 403 });
  }

  const patch: Record<string, string | null> = {};

  if (action === "accept") {
    if (!isSupportStaffRole(role)) return NextResponse.json({ error: "Only support agents can accept chats." }, { status: 403 });
    if (session?.status === "ENDED") return NextResponse.json({ error: "Ended chats cannot be accepted." }, { status: 400 });
    patch.employee_id = role === "support_senior" || role === "support_manager" || role === "admin" ? body.employee_id || context.user.id : context.user.id;
    patch.status = "ACTIVE";
  } else if (action === "end") {
    patch.status = "ENDED";
    patch.ended_at = new Date().toISOString();
  } else if (action === "transfer") {
    if (!isSupportStaffRole(role)) return NextResponse.json({ error: "Only support agents can transfer chats." }, { status: 403 });
    patch.employee_id = body.employee_id || null;
    patch.status = body.employee_id ? "ACTIVE" : "WAITING";
  } else {
    return NextResponse.json({ error: "Unsupported live chat action." }, { status: 400 });
  }

  const { data, error } = await context.adminClient
    .from("live_chat_sessions")
    .update(patch)
    .eq("id", sessionId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (action === "accept" && session?.ticket_id) {
    await context.adminClient.from("support_tickets").update({ assigned_employee_id: patch.employee_id, status: "IN_PROGRESS" }).eq("id", session.ticket_id);
  }

  return NextResponse.json({ session: data });
}
