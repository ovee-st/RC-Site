import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "New Support Ticket | MXVL",
  description: "Create a new Live Support ticket."
};

export default function NewSupportTicketPage() {
  return <TicketCenter mode="user" />;
}

