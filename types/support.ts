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
  user_role: SupportUserRole;
  username: string;
  subject: string;
  message: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assigned_employee_id?: string | null;
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
