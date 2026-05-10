import type { LiveChatSession, LiveChatStatus } from "@/types/liveChat";

export const liveChatStatuses: LiveChatStatus[] = ["WAITING", "ACTIVE", "ENDED"];

export function formatLiveChatStatus(status?: string | null) {
  return String(status || "WAITING").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function liveChatStatusTone(status?: string | null) {
  if (status === "ACTIVE") return "success";
  if (status === "ENDED") return "neutral";
  return "primary";
}

export function canManageLiveChat(role?: string | null) {
  return role === "employee" || role === "admin";
}

export function canViewLiveChat(role?: string | null, userId?: string | null, session?: Pick<LiveChatSession, "user_id" | "employee_id"> | null) {
  if (!role || !userId || !session) return false;
  if (role === "admin" || role === "viewer") return true;
  if (role === "employee") return !session.employee_id || session.employee_id === userId;
  return session.user_id === userId;
}
