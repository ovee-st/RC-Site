import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "New Support Ticket | RC",
  description: "Create a new RC support ticket."
};

export default function NewSupportTicketPage() {
  return <TicketCenter mode="user" />;
}
