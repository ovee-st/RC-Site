import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { makeTicketNumber, normalizeTicketUserRole } from "@/lib/support";

const AGENT_ROLES = new Set(["admin", "employee"]);

async function getRequester(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Missing session token." }, { status: 401 }) };

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, username, full_name, name")
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
  const role = normalizeTicketUserRole(context.profile?.role);
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const category = String(body.category || "Other").trim();
  const attachmentUrls = Array.isArray(body.attachment_urls) ? body.attachment_urls : [];

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  if (context.profile?.role !== "candidate" && context.profile?.role !== "employer") {
    return NextResponse.json({ error: "Only candidates and employers can create support tickets." }, { status: 403 });
  }

  const { data: employees } = await context.adminClient
    .from("employees")
    .select("id")
    .eq("is_active", true);

  let assignedEmployeeId: string | null = null;
  if (employees?.length) {
    const { data: openTickets } = await context.adminClient
      .from("support_tickets")
      .select("assigned_employee_id,status")
      .in("status", ["OPEN", "IN_PROGRESS", "WAITING_USER", "ESCALATED"]);

    assignedEmployeeId = employees
      .map((employee) => ({
        id: employee.id,
        count: (openTickets || []).filter((ticket) => ticket.assigned_employee_id === employee.id).length
      }))
      .sort((a, b) => a.count - b.count)[0]?.id || null;
  }

  const baseTicket = {
    ticket_number: makeTicketNumber(),
    user_id: context.user.id,
    user_role: role,
    username: context.profile?.username || context.user.email?.split("@")[0] || context.user.id,
    subject,
    category,
    message,
    priority: String(body.priority || "MEDIUM").toUpperCase(),
    status: assignedEmployeeId ? "IN_PROGRESS" : "OPEN",
    assigned_employee_id: assignedEmployeeId,
    attachment_url: attachmentUrls[0] || null,
    attachment_urls: attachmentUrls
  };

  let { data, error } = await context.adminClient
    .from("support_tickets")
    .insert(baseTicket)
    .select("*")
    .maybeSingle();

  if (error && /category|attachment_url|attachment_urls/i.test(error.message)) {
    const { category: _category, attachment_url: _attachmentUrl, attachment_urls: _attachmentUrls, ...legacyTicket } = baseTicket;
    const retry = await context.adminClient
      .from("support_tickets")
      .insert(legacyTicket)
      .select("*")
      .maybeSingle();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data?.id) {
    await context.adminClient.from("ticket_messages").insert({
      ticket_id: data.id,
      sender_id: context.user.id,
      sender_role: role,
      message,
      attachment_url: attachmentUrls[0] || null,
      attachment_urls: attachmentUrls,
      internal_note: false
    });

    await context.adminClient.from("ticket_activity").insert({
      ticket_id: data.id,
      actor_id: context.user.id,
      actor_role: role,
      action: assignedEmployeeId ? "created_and_assigned" : "created",
      metadata: { assigned_employee_id: assignedEmployeeId, category, priority: baseTicket.priority }
    });

    if (assignedEmployeeId) {
      await context.adminClient.from("notifications").insert({
        user_id: assignedEmployeeId,
        type: "support_ticket",
        title: "New support ticket assigned",
        message: `${baseTicket.ticket_number} needs follow-up: ${subject}`,
        is_read: false
      });
    }
  }

  return NextResponse.json({ ticket: data });
}
