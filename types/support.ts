export type SupportUserRole = "candidate" | "employer" | "employee" | "admin";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "ESCALATED"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SupportTicket = {
  id: string;
  ticket_number: string;
  user_id: string;
  user_role: "candidate" | "employer";
  username: string;
  subject: string;
  category?: string;
  message: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assigned_employee_id?: string | null;
  assigned_employee?: EmployeeProfile | null;
  attachment_url?: string | null;
  attachment_urls?: string[];
  created_at: string;
  updated_at?: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: SupportUserRole;
  message: string;
  attachment_url?: string | null;
  internal_note: boolean;
  attachment_urls?: string[];
  created_at: string;
};

export type EmployeeProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  username: string;
  department?: string;
  permissions: string[];
  active: boolean;
  created_at: string;
};

export type TicketActivity = {
  id: string;
  ticket_id: string;
  actor_id: string;
  actor_role: SupportUserRole;
  action: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};
