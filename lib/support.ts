import type { SupportTicket, SupportTicketPriority, SupportTicketStatus, SupportUserRole, TicketMessage } from "@/types/support";
import { canViewAllSupport, isSupportStaffRole } from "@/lib/supportRoles";

export const ticketStatuses: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_USER", "ESCALATED", "RESOLVED", "CLOSED"];

export const ticketPriorities: SupportTicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const ticketCategories = [
  "Billing",
  "CV Generation",
  "Job Applications",
  "Profile Issues",
  "Hiring Pipeline",
  "Subscription",
  "Technical Bug",
  "Other"
] as const;

export function formatTicketStatus(status: SupportTicketStatus | string) {
  return String(status).replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function makeTicketNumber(sequence?: number) {
  const value = sequence || Math.floor(100000 + Math.random() * 899999);
  return `MXVL-${new Date().getFullYear()}-${value}`;
}

export function getTicketTone(status: SupportTicketStatus | string) {
  const normalized = String(status).toUpperCase();
  if (normalized === "RESOLVED" || normalized === "CLOSED") return "success";
  if (normalized === "ESCALATED" || normalized === "URGENT") return "danger";
  if (normalized === "IN_PROGRESS" || normalized === "WAITING_USER") return "primary";
  return "neutral";
}

export function canSeeTicket(role?: string | null, userId?: string | null, ticket?: Pick<SupportTicket, "user_id" | "assigned_employee_id"> | null) {
  if (!ticket || !role) return false;
  if (canViewAllSupport(role)) return true;
  if (isSupportStaffRole(role)) return !ticket.assigned_employee_id || ticket.assigned_employee_id === userId;
  return ticket.user_id === userId;
}

export function canEditTicket(role?: string | null) {
  return isSupportStaffRole(role);
}

export const demoSupportTickets: SupportTicket[] = [
  {
    id: "support-demo-1",
    ticket_number: "MXVL-2026-100241",
    user_id: "candidate-demo",
    user_role: "candidate",
    username: "candidate_000245",
    subject: "Profile photo upload issue",
    category: "Profile Issues",
    message: "My profile photo is not showing after upload.",
    priority: "HIGH",
    status: "OPEN",
    assigned_employee_id: null,
    attachment_urls: [],
    created_at: "2026-05-06T10:00:00+06:00"
  },
  {
    id: "support-demo-2",
    ticket_number: "MXVL-2026-100242",
    user_id: "employer-demo",
    user_role: "employer",
    username: "employer_000081",
    subject: "Need help archiving a job",
    category: "Hiring Pipeline",
    message: "A closed job is still visible on the public jobs page.",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    assigned_employee_id: "employee-demo",
    attachment_urls: [],
    created_at: "2026-05-06T14:30:00+06:00"
  }
];

export const demoTicketMessages: TicketMessage[] = [
  {
    id: "message-demo-1",
    ticket_id: "support-demo-1",
    sender_id: "candidate-demo",
    sender_role: "candidate",
    message: "I uploaded a new JPG but the navbar still shows initials.",
    internal_note: false,
    attachment_urls: [],
    created_at: "2026-05-06T10:02:00+06:00"
  },
  {
    id: "message-demo-2",
    ticket_id: "support-demo-1",
    sender_id: "employee-demo",
    sender_role: "employee",
    message: "Check Supabase Storage public URL and profile photo cache.",
    internal_note: true,
    attachment_urls: [],
    created_at: "2026-05-06T10:08:00+06:00"
  }
];

export function normalizeSupportRole(role?: string | null): SupportUserRole {
  if (
    role === "employer" ||
    role === "employee" ||
    role === "support_agent" ||
    role === "support_senior" ||
    role === "support_manager" ||
    role === "admin" ||
    role === "viewer"
  ) {
    return role;
  }

  return "candidate";
}

export function normalizeTicketUserRole(role?: string | null): "candidate" | "employer" {
  return role === "employer" ? "employer" : "candidate";
}

