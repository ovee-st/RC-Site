import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { canSeeTicket, normalizeSupportRole } from "@/lib/support";

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

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { ticketId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const { data: ticket } = await context.adminClient
    .from("support_tickets")
    .select("user_id, assigned_employee_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!canSeeTicket(context.profile?.role, context.user.id, ticket)) {
    return NextResponse.json({ error: "You cannot access this ticket." }, { status: 403 });
  }

  let query = context.adminClient
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (context.profile?.role !== "admin" && context.profile?.role !== "employee") {
    query = query.eq("internal_note", false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { ticketId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  const { data: ticket } = await context.adminClient
    .from("support_tickets")
    .select("user_id, assigned_employee_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!canSeeTicket(context.profile?.role, context.user.id, ticket)) {
    return NextResponse.json({ error: "You cannot access this ticket." }, { status: 403 });
  }

  const senderRole = normalizeSupportRole(context.profile?.role);
  const internalNote = Boolean(body.internal_note && (senderRole === "admin" || senderRole === "employee"));

  const { data, error } = await context.adminClient
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_id: context.user.id,
      sender_role: senderRole,
      message,
      internal_note: internalNote,
      attachment_urls: body.attachment_urls || []
    })
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: data });
}
