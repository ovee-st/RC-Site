"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileUp,
  Inbox,
  Loader2,
  MessageSquareText,
  Paperclip,
  Send,
  ShieldCheck,
  Sparkles,
  StickyNote,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  canEditTicket,
  demoSupportTickets,
  demoTicketMessages,
  formatTicketStatus,
  getTicketTone,
  normalizeSupportRole,
  ticketCategories,
  ticketPriorities,
  ticketStatuses
} from "@/lib/support";
import { useSupportStore } from "@/store/useSupportStore";
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus, TicketActivity, TicketMessage } from "@/types/support";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { canExportSupportReports, isSupportStaffRole } from "@/lib/supportRoles";

type TicketCenterProps = {
  mode: "user" | "employee" | "admin";
};

type TicketDraft = {
  subject: string;
  category: string;
  message: string;
  priority: SupportTicketPriority;
  files: File[];
};

const emptyDraft: TicketDraft = {
  subject: "",
  category: "Other",
  message: "",
  priority: "MEDIUM",
  files: []
};

function getInitials(name?: string | null) {
  return (name || "MXVL")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusIcon(status: SupportTicketStatus) {
  if (status === "RESOLVED" || status === "CLOSED") return CheckCircle2;
  if (status === "ESCALATED") return AlertTriangle;
  if (status === "IN_PROGRESS" || status === "WAITING_USER") return Clock3;
  return Inbox;
}

function getPriorityClass(priority: SupportTicketPriority) {
  if (priority === "URGENT") return "border-red-200 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300";
  if (priority === "HIGH") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300";
  if (priority === "MEDIUM") return "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300";
  return "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

function minutesBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return "";
  const diff = Math.max(0, new Date(end).getTime() - new Date(start).getTime());
  return Math.round(diff / 60000).toString();
}

function formatDurationLabel(minutesValue: string) {
  const minutes = Number(minutesValue);
  if (!Number.isFinite(minutes) || minutesValue === "") return "Not recorded";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function isoDateOnly(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function isWithinDateRange(value: string, startDate: string, endDate: string) {
  const day = isoDateOnly(value);
  if (startDate && day < startDate) return false;
  if (endDate && day > endDate) return false;
  return true;
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return `"${text.replace(/"/g, '""')}"`;
}

function xmlCell(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadReport(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildSupportExportRows(
  tickets: SupportTicket[],
  messagesByTicket: Record<string, TicketMessage[]>,
  activitiesByTicket: Record<string, TicketActivity[]> = {}
) {
  const rows: Record<string, string>[] = [];

  tickets.forEach((ticket) => {
    const messages = [...(messagesByTicket[ticket.id] || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstAgentMessage = messages.find((message) => isSupportStaffRole(message.sender_role));
    const closedAt = ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? ticket.updated_at || ticket.created_at : "";
    const forwardedAt = ticket.assigned_employee_id ? ticket.updated_at || ticket.created_at : "";
    const firstResponseMinutes = minutesBetween(ticket.created_at, firstAgentMessage?.created_at || null);
    const forwardMinutes = minutesBetween(ticket.created_at, forwardedAt || null);
    const closeMinutes = minutesBetween(ticket.created_at, closedAt || null);

    rows.push({
      row_type: "ticket_summary",
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      requester: ticket.username,
      requester_role: ticket.user_role,
      category: ticket.category || "Other",
      priority: ticket.priority,
      status: ticket.status,
      assigned_employee_id: ticket.assigned_employee_id || "Unassigned",
      created_at: ticket.created_at,
      updated_at: ticket.updated_at || "",
      layer: "0",
      actor_role: "system",
      action: "Ticket opened",
      step_elapsed_minutes: "0",
      total_elapsed_minutes: "0",
      first_response_minutes: firstResponseMinutes,
      first_response_time: formatDurationLabel(firstResponseMinutes),
      forward_or_assignment_minutes: forwardMinutes,
      forward_or_assignment_time: formatDurationLabel(forwardMinutes),
      close_or_resolution_minutes: closeMinutes,
      close_or_resolution_time: formatDurationLabel(closeMinutes),
      message: ticket.message
    });

    const activities = [...(activitiesByTicket[ticket.id] || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const timeline = [
      ...activities.map((activity) => ({ kind: "activity" as const, at: activity.created_at, item: activity })),
      ...messages.map((message) => ({ kind: "message" as const, at: message.created_at, item: message }))
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    let previousAt = ticket.created_at;
    timeline.forEach((entry, index) => {
      const stepMinutes = minutesBetween(previousAt, entry.at);
      const totalMinutes = minutesBetween(ticket.created_at, entry.at);
      const isActivity = entry.kind === "activity";
      const activity = isActivity ? entry.item as TicketActivity : null;
      const message = !isActivity ? entry.item as TicketMessage : null;
      const activityMetadata = activity?.metadata ? JSON.stringify(activity.metadata) : "";

      rows.push({
        row_type: isActivity ? "movement_layer" : "message_layer",
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        requester: ticket.username,
        requester_role: ticket.user_role,
        category: ticket.category || "Other",
        priority: ticket.priority,
        status: ticket.status,
        assigned_employee_id: ticket.assigned_employee_id || "Unassigned",
        created_at: ticket.created_at,
        updated_at: ticket.updated_at || "",
        layer: String(index + 1),
        actor_role: activity?.actor_role || message?.sender_role || "system",
        action: activity?.action || (message?.internal_note ? "Internal note" : "Reply"),
        step_elapsed_minutes: stepMinutes,
        total_elapsed_minutes: totalMinutes,
        first_response_minutes: firstResponseMinutes,
        first_response_time: formatDurationLabel(firstResponseMinutes),
        forward_or_assignment_minutes: forwardMinutes,
        forward_or_assignment_time: formatDurationLabel(forwardMinutes),
        close_or_resolution_minutes: closeMinutes,
        close_or_resolution_time: formatDurationLabel(closeMinutes),
        message: message?.message || activityMetadata
      });
      previousAt = entry.at;
    });
  });

  return rows;
}

const exportColumns = [
  "row_type",
  "ticket_number",
  "subject",
  "requester",
  "requester_role",
  "category",
  "priority",
  "status",
  "assigned_employee_id",
  "created_at",
  "updated_at",
  "layer",
  "actor_role",
  "action",
  "step_elapsed_minutes",
  "total_elapsed_minutes",
  "first_response_minutes",
  "first_response_time",
  "forward_or_assignment_minutes",
  "forward_or_assignment_time",
  "close_or_resolution_minutes",
  "close_or_resolution_time",
  "message"
];

function exportRowsAsCsv(rows: Record<string, string>[], filename: string) {
  const csv = [exportColumns.join(","), ...rows.map((row) => exportColumns.map((column) => csvCell(row[column])).join(","))].join("\n");
  downloadReport(csv, filename, "text/csv;charset=utf-8");
}

function exportRowsAsXlsx(rows: Record<string, string>[], filename: string) {
  const sheetRows = [exportColumns, ...rows.map((row) => exportColumns.map((column) => row[column] || ""))]
    .map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xmlCell(cell)}</Data></Cell>`).join("")}</Row>`)
    .join("");
  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Support Report"><Table>${sheetRows}</Table></Worksheet></Workbook>`;
  downloadReport(workbook, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8");
}
async function uploadTicketFiles(files: File[], ticketId: string) {
  if (!files.length || !isSupabaseConfigured) return [];

  const uploads = await Promise.all(files.map(async (file) => {
    const path = `${ticketId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("support-attachments").upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
    return data.publicUrl;
  }));

  return uploads.filter(Boolean) as string[];
}

export default function TicketCenter({ mode }: TicketCenterProps) {
  const { user, role, loading } = useAuth();
  const {
    tickets,
    messagesByTicket,
    selectedTicketId,
    setTickets,
    upsertTicket,
    setMessages,
    addMessage,
    selectTicket,
    moveTicket
  } = useSupportStore();
  const [draft, setDraft] = useState<TicketDraft>(emptyDraft);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [moveMenuTicketId, setMoveMenuTicketId] = useState<string | null>(null);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportingTicketId, setExportingTicketId] = useState<string | null>(null);
  const ticketWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const roleValue = role as string | null;

  const isAgent = mode === "employee" || mode === "admin";
  const currentRole = normalizeSupportRole(roleValue);
  const userMetadata = (user?.user_metadata || {}) as Record<string, unknown>;
  const displayName = user?.name || user?.user_metadata?.full_name || user?.email || "MXVL User";
  const username = user?.username || String(userMetadata.username || "") || `${currentRole}_${String(user?.id || "000000").slice(0, 6)}`;
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) || null;
  const selectedMessages = selectedTicket ? messagesByTicket[selectedTicket.id] || [] : [];
  const canExportReports = canExportSupportReports(roleValue);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setDataLoading(true);

      if (!isSupabaseConfigured || !user) {
        if (!active) return;
        setTickets(demoSupportTickets.filter((ticket) => isAgent || ticket.user_id === "candidate-demo"));
        setMessages("support-demo-1", demoTicketMessages);
        setDataLoading(false);
        return;
      }

      let query = supabase.from("support_tickets").select("*").order("created_at", { ascending: false });

      if (!isAgent) {
        query = query.eq("user_id", user.id);
      } else if (mode === "employee" && (roleValue === "employee" || roleValue === "support_agent")) {
        query = query.or(`assigned_employee_id.is.null,assigned_employee_id.eq.${user.id}`);
      }

      const { data } = await query.limit(100);

      if (!active) return;

      const rows = (data || []) as SupportTicket[];
      setTickets(rows);
      setDataLoading(false);
    }

    if (!loading) loadTickets();

    return () => {
      active = false;
    };
  }, [isAgent, loading, mode, setMessages, setTickets, user]);

  useSupportRealtime({
    channelKey: mode,
    onTicketChange: upsertTicket,
    onMessageCreate: addMessage
  });

  useEffect(() => {
    function handleOutsideClick(event: globalThis.MouseEvent) {
      if (!ticketWorkspaceRef.current) return;
      if (!ticketWorkspaceRef.current.contains(event.target as Node)) {
        selectTicket(null);
        setMoveMenuTicketId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectTicket]);

  useEffect(() => {
    let active = true;

    async function loadMessages(ticketId: string) {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (!active) return;
      setMessages(ticketId, (data || []) as TicketMessage[]);
    }

    if (selectedTicket?.id) loadMessages(selectedTicket.id);

    return () => {
      active = false;
    };
  }, [selectedTicket?.id, setMessages]);

  const counts = useMemo(() => {
    return ticketStatuses.reduce<Record<SupportTicketStatus, number>>((acc, status) => {
      acc[status] = tickets.filter((ticket) => ticket.status === status).length;
      return acc;
    }, {} as Record<SupportTicketStatus, number>);
  }, [tickets]);

  async function createTicket() {
    if (!user || !draft.subject.trim() || !draft.message.trim()) return;

    setIsCreating(true);
    const id = crypto.randomUUID();
    const attachment_urls = await uploadTicketFiles(draft.files, id);
    const ticket: Omit<SupportTicket, "created_at"> & { created_at?: string } = {
      id,
      ticket_number: `MXVL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`,
      user_id: user.id,
      user_role: currentRole === "employer" ? "employer" : "candidate",
      username,
      subject: draft.subject.trim(),
      category: draft.category,
      message: draft.message.trim(),
      priority: draft.priority,
      status: "OPEN",
      assigned_employee_id: null,
      attachment_urls
    };

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({
          subject: ticket.subject,
          category: draft.category,
          message: ticket.message,
          priority: ticket.priority,
          attachment_urls
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatusMessage(payload.error || "Could not create ticket.");
        setIsCreating(false);
        return;
      }
      upsertTicket(payload.ticket as SupportTicket);
      selectTicket((payload.ticket as SupportTicket).id);
    } else {
      const localTicket = { ...ticket, created_at: new Date().toISOString() } as SupportTicket;
      upsertTicket(localTicket);
      selectTicket(localTicket.id);
    }

    setDraft(emptyDraft);
    setStatusMessage("Ticket created. Support will follow up from this thread.");
    setIsCreating(false);
  }

  async function sendReply() {
    if (!user || !selectedTicket || !reply.trim()) return;

    const message: Omit<TicketMessage, "created_at"> = {
      id: crypto.randomUUID(),
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: currentRole,
      message: reply.trim(),
      internal_note: isAgent && internalNote,
      attachment_urls: []
    };

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({
          message: message.message,
          internal_note: message.internal_note,
          attachment_urls: message.attachment_urls
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatusMessage(payload.error || "Could not send reply.");
        return;
      }
      addMessage(payload.message as TicketMessage);
    } else {
      addMessage({ ...message, created_at: new Date().toISOString() });
    }

    setReply("");
    setInternalNote(false);
  }

  async function updateStatus(ticketId: string, status: SupportTicketStatus) {
    moveTicket(ticketId, status);
    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({ status })
      });
    }
  }

  async function assignToMe(ticketId: string) {
    if (!user || !canEditTicket(roleValue)) return;
    const patch = { assigned_employee_id: user.id, status: "IN_PROGRESS" as SupportTicketStatus, updated_at: new Date().toISOString() };
    const ticket = tickets.find((item) => item.id === ticketId);
    if (ticket) upsertTicket({ ...ticket, ...patch });
    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({ assigned_employee_id: user.id, status: "IN_PROGRESS" })
      });
    }
  }

  function toggleTicket(ticketId: string) {
    const nextId = selectedTicketId === ticketId ? null : ticketId;
    selectTicket(nextId);
    setMoveMenuTicketId(null);
  }

  function handleMoveButtonClick(event: ReactMouseEvent<HTMLButtonElement>, ticketId: string) {
    event.stopPropagation();
    selectTicket(ticketId);
    setMoveMenuTicketId((current) => current === ticketId ? null : ticketId);
  }

  async function moveSelectedTicket(ticketId: string, status: SupportTicketStatus) {
    await updateStatus(ticketId, status);
    setMoveMenuTicketId(null);
    selectTicket(ticketId);
  }

  async function exportSupportReport(format: "csv" | "xlsx") {
    if (!canExportReports) return;
    setIsExporting(true);

    try {
      const scopedTickets = tickets.filter((ticket) => {
        const createdMatch = isWithinDateRange(ticket.created_at, exportStartDate, exportEndDate);
        const updatedMatch = ticket.updated_at ? isWithinDateRange(ticket.updated_at, exportStartDate, exportEndDate) : false;
        return createdMatch || updatedMatch;
      });

      if (!scopedTickets.length) {
        setStatusMessage("No support tickets found for the selected date range.");
        return;
      }

      const exportMessagesByTicket: Record<string, TicketMessage[]> = { ...messagesByTicket };
      const exportActivitiesByTicket: Record<string, TicketActivity[]> = {};

      if (isSupabaseConfigured) {
        const ticketIds = scopedTickets.map((ticket) => ticket.id);
        const { data } = await supabase
          .from("ticket_messages")
          .select("*")
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });

        if (data) {
          ticketIds.forEach((ticketId) => {
            exportMessagesByTicket[ticketId] = [];
          });
          (data as TicketMessage[]).forEach((message) => {
            exportMessagesByTicket[message.ticket_id] = [...(exportMessagesByTicket[message.ticket_id] || []), message];
          });
        }

        const { data: activityData } = await supabase
          .from("ticket_activity")
          .select("*")
          .in("ticket_id", ticketIds)
          .order("created_at", { ascending: true });

        if (activityData) {
          ticketIds.forEach((ticketId) => {
            exportActivitiesByTicket[ticketId] = [];
          });
          (activityData as TicketActivity[]).forEach((activity) => {
            exportActivitiesByTicket[activity.ticket_id] = [...(exportActivitiesByTicket[activity.ticket_id] || []), activity];
          });
        }
      }

      const rows = buildSupportExportRows(scopedTickets, exportMessagesByTicket, exportActivitiesByTicket);
      const stamp = `${exportStartDate || "all"}_to_${exportEndDate || isoDateOnly(new Date().toISOString())}`;

      if (format === "csv") {
        exportRowsAsCsv(rows, `mxvl-support-report-${stamp}.csv`);
      } else {
        exportRowsAsXlsx(rows, `mxvl-support-report-${stamp}.xlsx`);
      }

      setStatusMessage(`Support report exported as ${format.toUpperCase()}.`);
    } finally {
      setIsExporting(false);
    }
  }

  async function exportSingleTicket(ticket: SupportTicket, format: "csv" | "xlsx") {
    if (!canExportReports) return;
    setExportingTicketId(ticket.id);

    try {
      let ticketMessages = messagesByTicket[ticket.id] || [];
      let ticketActivities: TicketActivity[] = [];

      if (isSupabaseConfigured) {
        const [{ data: messageData }, { data: activityData }] = await Promise.all([
          supabase
            .from("ticket_messages")
            .select("*")
            .eq("ticket_id", ticket.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("ticket_activity")
            .select("*")
            .eq("ticket_id", ticket.id)
            .order("created_at", { ascending: true })
        ]);

        if (messageData) ticketMessages = messageData as TicketMessage[];
        if (activityData) ticketActivities = activityData as TicketActivity[];
      }

      const rows = buildSupportExportRows([ticket], { [ticket.id]: ticketMessages }, { [ticket.id]: ticketActivities });
      const safeNumber = ticket.ticket_number.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

      if (format === "csv") {
        exportRowsAsCsv(rows, `${safeNumber}-support-route.csv`);
      } else {
        exportRowsAsXlsx(rows, `${safeNumber}-support-route.xlsx`);
      }

      setStatusMessage(`${ticket.ticket_number} exported as ${format.toUpperCase()}.`);
    } finally {
      setExportingTicketId(null);
    }
  }

  if (loading || dataLoading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="flex items-center gap-3 rounded-3xl p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-bold text-text-muted">Loading support workspace...</span>
        </Card>
      </main>
    );
  }

  if ((mode === "employee" && !isSupportStaffRole(roleValue)) || (mode === "admin" && roleValue !== "admin" && roleValue !== "viewer")) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="max-w-md rounded-3xl p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-2xl font-black text-text-main dark:text-white">Access restricted</h1>
          <p className="mt-2 text-sm font-semibold text-text-muted">This support workspace is only available to authorized MXVL team members.</p>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/60 bg-white/82 p-5 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 lg:grid-cols-[1fr_auto]">
        <div>
          <Badge variant="primary" className="type-label">{isAgent ? "Employee Support Desk" : "Support Center"}</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl">
            {isAgent ? "Resolve tickets with context, speed, and care." : "Get help from the Live Support team."}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">
            Realtime ticket tracking, threaded replies, internal notes, assignments, and compact ticket movement built for fast support work.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[520px]">
          {[
            { label: "Open", value: counts.OPEN || 0, icon: Inbox },
            { label: "In progress", value: counts.IN_PROGRESS || 0, icon: Clock3 },
            { label: "Escalated", value: counts.ESCALATED || 0, icon: AlertTriangle },
            { label: "Resolved", value: (counts.RESOLVED || 0) + (counts.CLOSED || 0), icon: CheckCircle2 }
          ].map((item) => {
            const Icon = item.icon;
            return (
            <Card key={item.label} className="rounded-2xl p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-2xl font-black text-text-main dark:text-white">{item.value}</p>
              <p className="text-xs font-bold text-text-muted">{item.label}</p>
            </Card>
            );
          })}
        </div>
      </div>

      {statusMessage ? (
        <div className="mb-5 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-bold text-success">
          {statusMessage}
        </div>
      ) : null}

      {canExportReports ? (
        <Card className="mb-5 rounded-3xl p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="type-label text-primary">Manager export</p>
                <p className="text-sm font-bold text-text-muted">Download CSV/XLSX reports with response, forward, close, and layer-by-layer timestamps.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="date"
                value={exportStartDate}
                onChange={(event) => setExportStartDate(event.target.value)}
                className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-main outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Export start date"
              />
              <input
                type="date"
                value={exportEndDate}
                onChange={(event) => setExportEndDate(event.target.value)}
                className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-main outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Export end date"
              />
              <Button variant="secondary" className="gap-2 px-4 py-2" disabled={isExporting} onClick={() => exportSupportReport("csv")}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                CSV
              </Button>
              <Button className="gap-2 px-4 py-2" disabled={isExporting} onClick={() => exportSupportReport("xlsx")}>
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                XLSX
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div
        ref={ticketWorkspaceRef}
        className={cn("grid min-w-0 gap-6", !isAgent && "xl:grid-cols-[360px_minmax(0,1fr)]")}
      >
        {!isAgent ? (
          <Card className="rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-text-main dark:text-white">Create a ticket</h2>
                <p className="mt-1 text-sm font-semibold text-text-muted">Use your username <span className="text-primary">{username}</span> for tracking.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Input value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Ticket subject" />
              <select
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900"
              >
                {ticketCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <textarea
                value={draft.message}
                onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
                placeholder="Describe what happened..."
                className="min-h-28 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary dark:border-white/10 dark:bg-slate-900"
              />
              <select
                value={draft.priority}
                onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value as SupportTicketPriority }))}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900"
              >
                {ticketPriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-border bg-bg px-4 py-3 text-sm font-bold text-text-muted dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center gap-2"><FileUp className="h-4 w-4" />Upload screenshots/files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => setDraft((current) => ({ ...current, files: Array.from(event.target.files || []) }))}
                />
              </label>
              {draft.files.length ? <p className="text-xs font-bold text-text-muted">{draft.files.length} file(s) selected</p> : null}
              <Button disabled={isCreating || !draft.subject || !draft.message} onClick={createTicket} className="gap-2">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit ticket
              </Button>
            </div>
          </Card>
        ) : null}

        <div className={cn("grid min-w-0 gap-4", isAgent && selectedTicket && "xl:grid-cols-[minmax(0,1fr)_420px]")}>
          <Card className="overflow-hidden rounded-3xl p-0">
            <div className="flex flex-col gap-3 border-b border-border p-5 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="type-label text-primary">Ticket queue</p>
                <h2 className="mt-1 text-xl font-black text-text-main dark:text-white">{isAgent ? "Assigned and open tickets" : "Your tickets"}</h2>
              </div>
              <p className="text-xs font-bold text-text-muted">Click a row to open details. Export captures chat history and movement timing.</p>
            </div>

            {tickets.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead className="bg-bg/80 text-xs font-black uppercase tracking-wider text-text-muted dark:bg-white/5">
                    <tr>
                      <th className="px-5 py-3">Ticket</th>
                      <th className="px-5 py-3">Requester</th>
                      <th className="px-5 py-3">Priority</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Updated</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-white/10">
                    {tickets.map((ticket) => {
                      const active = selectedTicket?.id === ticket.id;
                      const TicketStatusIcon = statusIcon(ticket.status);
                      return (
                        <Fragment key={ticket.id}>
                          <tr
                            key={ticket.id}
                            onClick={() => toggleTicket(ticket.id)}
                            className={cn(
                              "cursor-pointer transition hover:bg-primary/5 dark:hover:bg-white/5",
                              active && "bg-primary/5 dark:bg-primary/10"
                            )}
                          >
                            <td className="px-5 py-4 align-top">
                              <p className="text-xs font-black uppercase tracking-wider text-primary">{ticket.ticket_number}</p>
                              <h3 className="mt-1 line-clamp-1 text-sm font-black text-text-main dark:text-white">{ticket.subject}</h3>
                              <p className="mt-1 line-clamp-1 text-xs font-semibold text-text-muted">{ticket.category || "Other"}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <p className="text-sm font-black text-text-main dark:text-white">{ticket.username}</p>
                              <p className="text-xs font-bold capitalize text-text-muted">{ticket.user_role}</p>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", getPriorityClass(ticket.priority))}>{ticket.priority}</span>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <Badge variant={getTicketTone(ticket.status) as any} className="gap-1.5">
                                <TicketStatusIcon className="h-3 w-3" />
                                {formatTicketStatus(ticket.status)}
                              </Badge>
                            </td>
                            <td className="px-5 py-4 align-top text-xs font-bold text-text-muted">
                              {new Date(ticket.updated_at || ticket.created_at).toLocaleString()}
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex justify-end gap-2">
                                {ticket.attachment_urls?.length ? <span className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-bold text-text-muted dark:border-white/10"><Paperclip className="h-3 w-3" />{ticket.attachment_urls.length}</span> : null}
                                {isAgent ? (
                                  <>
                                    <Button variant="secondary" className="px-3 py-2 text-xs" onClick={(event) => handleMoveButtonClick(event, ticket.id)}>
                                      Move
                                    </Button>
                                    {canExportReports ? (
                                      <>
                                        <Button
                                          variant="secondary"
                                          className="gap-1 px-3 py-2 text-xs"
                                          disabled={exportingTicketId === ticket.id}
                                          onClick={(event) => { event.stopPropagation(); exportSingleTicket(ticket, "csv"); }}
                                        >
                                          {exportingTicketId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                          CSV
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          className="gap-1 px-3 py-2 text-xs"
                                          disabled={exportingTicketId === ticket.id}
                                          onClick={(event) => { event.stopPropagation(); exportSingleTicket(ticket, "xlsx"); }}
                                        >
                                          {exportingTicketId === ticket.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                          XLSX
                                        </Button>
                                      </>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {!isAgent && active ? (
                            <tr key={`${ticket.id}-expanded`} className="bg-primary/5 dark:bg-primary/10">
                              <td colSpan={6} className="px-5 pb-5">
                                <div className="grid gap-4 rounded-2xl border border-primary/15 bg-white p-4 shadow-soft dark:border-primary/20 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_280px]">
                                  <div>
                                    <p className="text-sm font-semibold leading-6 text-text-muted">{ticket.message}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-xs font-black text-white">
                                        {getInitials(ticket.username)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-text-main dark:text-white">{ticket.username}</p>
                                        <p className="text-xs font-bold text-text-muted">{ticket.user_role} - Created {new Date(ticket.created_at).toLocaleString()}</p>
                                      </div>
                                      {isAgent ? (
                                        <Button variant="secondary" className="ml-auto gap-2 px-3 py-2" onClick={(event) => { event.stopPropagation(); assignToMe(ticket.id); }}>
                                          <UserPlus className="h-4 w-4" />
                                          Assign to me
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                  {isAgent && moveMenuTicketId === ticket.id ? (
                                    <div className="rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5" onClick={(event) => event.stopPropagation()}>
                                      <p className="type-label text-primary">Move ticket</p>
                                      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
                                        {ticketStatuses.map((status) => (
                                          <Button
                                            key={status}
                                            variant={ticket.status === status ? "primary" : "secondary"}
                                            className="justify-center px-3 py-2 text-xs"
                                            onClick={() => moveSelectedTicket(ticket.id, status)}
                                          >
                                            {formatTicketStatus(status)}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5">
                                      <p className="type-label text-primary">Thread summary</p>
                                      <p className="mt-2 text-sm font-black text-text-main dark:text-white">{(messagesByTicket[ticket.id] || []).length} replies</p>
                                      <p className="mt-1 text-xs font-semibold text-text-muted">Conversation opens in the side panel.</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl border border-dashed border-border p-6 text-center dark:border-white/10">
                  <Sparkles className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-3 text-sm font-black text-text-main dark:text-white">No tickets yet</p>
                  <p className="mt-1 text-xs font-semibold text-text-muted">New support requests will appear here.</p>
                </div>
              </div>
            )}
          </Card>

          {selectedTicket ? (
            <Card className={cn("min-w-0 overflow-hidden rounded-3xl p-0", isAgent && "xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto")}>
              <div className="border-b border-border p-5 dark:border-white/10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="type-label text-primary">{selectedTicket.ticket_number}</p>
                    <h2 className="mt-1 text-2xl font-black text-text-main dark:text-white">{selectedTicket.subject}</h2>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">{selectedTicket.message}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getTicketTone(selectedTicket.status) as any}>{formatTicketStatus(selectedTicket.status)}</Badge>
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-black", getPriorityClass(selectedTicket.priority))}>{selectedTicket.priority}</span>
                    {isAgent ? (
                      <Button variant="secondary" className="px-3 py-2" onClick={() => setMoveMenuTicketId((current) => current === selectedTicket.id ? null : selectedTicket.id)}>
                        Move ticket
                      </Button>
                    ) : null}
                  </div>
                </div>
                {isAgent && moveMenuTicketId === selectedTicket.id ? (
                  <div className="mt-4 grid gap-2 rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5 sm:grid-cols-3 lg:grid-cols-6">
                    {ticketStatuses.map((status) => (
                      <Button
                        key={status}
                        variant={selectedTicket.status === status ? "primary" : "secondary"}
                        className="px-3 py-2 text-xs"
                        onClick={() => moveSelectedTicket(selectedTicket.id, status)}
                      >
                        {formatTicketStatus(status)}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={cn("grid gap-4 p-5", !isAgent && "lg:grid-cols-[1fr_260px]")}>
                <div className="grid gap-3">
                  {selectedMessages.length ? selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "rounded-2xl border p-4",
                        message.internal_note
                          ? "border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-500/10"
                          : "border-border bg-bg dark:border-white/10 dark:bg-white/5"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-sm font-black text-text-main dark:text-white">
                          {message.internal_note ? <StickyNote className="h-4 w-4 text-amber-500" /> : <MessageSquareText className="h-4 w-4 text-primary" />}
                          {message.sender_role}
                        </p>
                        <p className="text-xs font-bold text-text-muted">{new Date(message.created_at).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-semibold leading-6 text-text-muted">{message.message}</p>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-center dark:border-white/10">
                      <MessageSquareText className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-2 text-sm font-black text-text-main dark:text-white">No replies yet</p>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={isAgent ? "Reply to the user or add an internal note..." : "Reply to support..."}
                      className="min-h-24 w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold outline-none"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {isAgent ? (
                        <label className="flex items-center gap-2 text-xs font-bold text-text-muted">
                          <input type="checkbox" checked={internalNote} onChange={(event) => setInternalNote(event.target.checked)} />
                          Internal note
                        </label>
                      ) : <span />}
                      <Button onClick={sendReply} disabled={!reply.trim()} className="gap-2">
                        <Send className="h-4 w-4" />
                        Send reply
                      </Button>
                    </div>
                  </div>
                </div>

                <Card className="h-fit rounded-2xl p-4">
                  <p className="type-label text-primary">Activity timeline</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      ["Created", selectedTicket.created_at],
                      ["Last update", selectedTicket.updated_at || selectedTicket.created_at],
                      ["Current status", formatTicketStatus(selectedTicket.status)]
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-3">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <p className="text-xs font-black text-text-main dark:text-white">{label}</p>
                          <p className="text-xs font-semibold text-text-muted">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}



