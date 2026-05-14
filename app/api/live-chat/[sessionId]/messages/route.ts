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

  const { data: session } = await context.adminClient
    .from("live_chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!canViewLiveChat(context.profile?.role, context.user.id, session)) {
    return NextResponse.json({ error: "You cannot access this live chat." }, { status: 403 });
  }

  const { data, error } = await context.adminClient
    .from("live_chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { sessionId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const { data: session } = await context.adminClient
    .from("live_chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!canViewLiveChat(context.profile?.role, context.user.id, session)) {
    return NextResponse.json({ error: "You cannot send messages in this live chat." }, { status: 403 });
  }
  if (session?.status === "ENDED") return NextResponse.json({ error: "This chat has ended." }, { status: 400 });

  const senderRole = String(context.profile?.role || "candidate");
  const agentReply = isSupportStaffRole(senderRole);
  if (agentReply && session?.status === "WAITING") {
    await context.adminClient
      .from("live_chat_sessions")
      .update({
        status: "ACTIVE",
        employee_id: session.employee_id || context.user.id,
        last_message_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (session?.ticket_id) {
      await context.adminClient
        .from("support_tickets")
        .update({
          status: "IN_PROGRESS",
          assigned_employee_id: session.employee_id || context.user.id,
          updated_at: new Date().toISOString()
        })
        .eq("id", session.ticket_id);
    }
  }

  const { data, error } = await context.adminClient
    .from("live_chat_messages")
    .insert({
      session_id: sessionId,
      sender_id: context.user.id,
      sender_role: senderRole === "viewer" ? "admin" : senderRole,
      message,
      attachment_url: body.attachment_url || null
    })
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await context.adminClient
    .from("live_chat_sessions")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (session?.ticket_id) {
    await context.adminClient.from("ticket_messages").insert({
      ticket_id: session.ticket_id,
      sender_id: context.user.id,
      sender_role: senderRole,
      message,
      internal_note: false
    });
  }

  const notifyUserId = senderRole === "candidate" || senderRole === "employer" ? session?.employee_id : session?.user_id;
  if (notifyUserId) {
    await context.adminClient.from("notifications").insert({
      user_id: notifyUserId,
      type: "live_chat",
      title: "New live chat message",
      message: message.slice(0, 120),
      is_read: false
    });
  }

  return NextResponse.json({ message: data });
}
