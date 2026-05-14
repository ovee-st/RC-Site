import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Ticket | MXVL",
  description: "View and reply to your Live Support ticket."
};

export default function SupportTicketDetailPage() {
  return <TicketCenter mode="user" />;
}

