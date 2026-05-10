export type LiveChatStatus = "WAITING" | "ACTIVE" | "ENDED";

export type LiveChatSession = {
  id: string;
  ticket_id?: string | null;
  user_id: string;
  user_role: "candidate" | "employer";
  username?: string | null;
  employee_id?: string | null;
  status: LiveChatStatus;
  started_at: string;
  ended_at?: string | null;
  last_message_at?: string | null;
};

export type LiveChatMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  sender_role: "candidate" | "employer" | "employee" | "admin" | "viewer";
  message: string;
  attachment_url?: string | null;
  created_at: string;
};
