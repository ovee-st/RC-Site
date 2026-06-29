import { after, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { makeTicketNumber, normalizeTicketUserRole } from "@/lib/support";
import { canViewAllSupport, isSupportStaffRole } from "@/lib/supportRoles";

const AGENT_ROLES = new Set(["employee", "support_agent", "support_senior", "support_manager", "admin", "viewer"]);
const LIVE_CHAT_SESSION_SELECT = "id,ticket_id,user_id,user_role,username,employee_id,status,started_at,ended_at,last_message_at";
const SUPPORT_TICKET_ID_SELECT = "id";

async function getRequester(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Missing session token." }, { status: 401 }) };

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return { error: NextResponse.json({ error: "Invalid session." }, { status: 401 }) };

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, username, full_name, name, email")
    .eq("id", authData.user.id)
    .maybeSingle();

  return { adminClient, user: authData.user, profile };
}

async function getAvailableEmployee(adminClient: ReturnType<typeof createServerSupabaseClient>) {
  const { data: employees } = await adminClient.from("employees").select("id").eq("is_active", true);
  if (!employees?.length) return null;

  const { data: activeChats } = await adminClient
    .from("live_chat_sessions")
    .select("employee_id,status")
    .eq("status", "ACTIVE");

  return employees
    .map((employee) => ({
      id: employee.id,
      count: (activeChats || []).filter((chat) => chat.employee_id === employee.id).length
    }))
    .sort((a, b) => a.count - b.count)[0]?.id || null;
}

export async function GET(request: Request) {
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const role = String(context.profile?.role || "");
  let query = context.adminClient.from("live_chat_sessions").select(LIVE_CHAT_SESSION_SELECT).order("last_message_at", { ascending: false });

  if (role === "candidate" || role === "employer") {
    query = query.eq("user_id", context.user.id);
  } else if (isSupportStaffRole(role) && !canViewAllSupport(role)) {
    query = query.or(`employee_id.is.null,employee_id.eq.${context.user.id}`);
  } else if (!AGENT_ROLES.has(role)) {
    return NextResponse.json({ error: "You cannot access live chat sessions." }, { status: 403 });
  }

  const { data, error } = await query.limit(100);
  if (error) {
    const setupMissing = /live_chat_sessions|schema cache|does not exist|Could not find/i.test(error.message);
    if (setupMissing) {
      return NextResponse.json({
        sessions: [],
        setupRequired: true,
        message: "Live chat tables are not configured yet."
      });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ sessions: data || [] });
}

export async function POST(request: Request) {
  const context = await getRequester(request);
  if ("error" in context) return context.error;

  const role = String(context.profile?.role || "");
  if (role !== "candidate" && role !== "employer") {
    return NextResponse.json({ error: "Only candidates and employers can start live chat." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const initialMessage = String(body.message || "").trim();
  const ticketSummary = initialMessage || "Live chat session opened.";
  const username = context.profile?.username || context.user.email?.split("@")[0] || context.user.id;

  const { data: existing } = await context.adminClient
    .from("live_chat_sessions")
    .select(LIVE_CHAT_SESSION_SELECT)
    .eq("user_id", context.user.id)
    .neq("status", "ENDED")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return NextResponse.json({ session: existing });

  const employeeId = await getAvailableEmployee(context.adminClient);
  const { data: session, error: sessionError } = await context.adminClient
    .from("live_chat_sessions")
    .insert({
      ticket_id: null,
      user_id: context.user.id,
      user_role: normalizeTicketUserRole(role),
      username,
      employee_id: employeeId,
      status: employeeId ? "ACTIVE" : "WAITING",
      last_message_at: new Date().toISOString()
    })
    .select(LIVE_CHAT_SESSION_SELECT)
    .maybeSingle();

  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 400 });

  if (session?.id) {
    after(async () => {
      const ticketInsert = {
        ticket_number: makeTicketNumber(),
        user_id: context.user.id,
        user_role: normalizeTicketUserRole(role),
        username,
        subject: "Live chat support request",
        category: "Technical Bug",
        message: ticketSummary,
        priority: "MEDIUM",
        status: employeeId ? "IN_PROGRESS" : "OPEN",
        assigned_employee_id: employeeId
      };

      let { data: ticket, error: ticketError } = await context.adminClient.from("support_tickets").insert(ticketInsert).select(SUPPORT_TICKET_ID_SELECT).maybeSingle();
      if (ticketError && /category/i.test(ticketError.message)) {
        const { category: _category, ...legacyTicket } = ticketInsert;
        const retry = await context.adminClient.from("support_tickets").insert(legacyTicket).select(SUPPORT_TICKET_ID_SELECT).maybeSingle();
        ticket = retry.data;
        ticketError = retry.error;
      }

      if (!ticketError && ticket?.id) {
        await context.adminClient
          .from("live_chat_sessions")
          .update({ ticket_id: ticket.id })
          .eq("id", session.id);

        if (initialMessage) {
          await context.adminClient.from("live_chat_messages").insert({
            session_id: session.id,
            sender_id: context.user.id,
            sender_role: role,
            message: initialMessage
          });
          await context.adminClient.from("ticket_messages").insert({
            ticket_id: ticket.id,
            sender_id: context.user.id,
            sender_role: role,
            message: initialMessage,
            internal_note: false
          });
        }
      }

      if (employeeId) {
        await context.adminClient.from("notifications").insert({
          user_id: employeeId,
          type: "live_chat",
          title: "New live chat assigned",
          message: `${username} started a live support chat.`,
          is_read: false
        });
      }
    });
  }

  return NextResponse.json({ session, ticket: null });
}
