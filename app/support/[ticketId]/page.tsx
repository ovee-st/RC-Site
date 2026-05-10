import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Ticket | RC",
  description: "View and reply to your RC support ticket."
};

export default function SupportTicketDetailPage() {
  return <TicketCenter mode="user" />;
}
