import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { canEditTicket, canSeeTicket, ticketStatuses } from "@/lib/support";

async function getRequester(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Missing session token." }, { status: 401 }) };

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  return { adminClient, user: authData.user, profile };
}

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { ticketId } = await params;
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  if (!canEditTicket(context.profile?.role)) {
    return NextResponse.json({ error: "Only support employees and admins can update tickets." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { data: ticket } = await context.adminClient
    .from("support_tickets")
    .select("user_id, assigned_employee_id")
    .eq("id", ticketId)
    .maybeSingle();

  if (!canSeeTicket(context.profile?.role, context.user.id, ticket)) {
    return NextResponse.json({ error: "You cannot update this ticket." }, { status: 403 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status && ticketStatuses.includes(body.status)) patch.status = body.status;
  if ("assigned_employee_id" in body) patch.assigned_employee_id = body.assigned_employee_id || null;
  if (body.priority) patch.priority = body.priority;

  const { data, error } = await context.adminClient
    .from("support_tickets")
    .update(patch)
    .eq("id", ticketId)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await context.adminClient.from("ticket_activity").insert({
    ticket_id: ticketId,
    actor_id: context.user.id,
    actor_role: context.profile?.role || "employee",
    action: body.status ? "status_changed" : "ticket_updated",
    metadata: patch
  });

  return NextResponse.json({ ticket: data });
}
