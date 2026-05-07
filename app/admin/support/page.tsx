import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Tickets | RC Admin",
  description: "Admin support ticket management."
};

export default function AdminSupportTicketsPage() {
  return <TicketCenter mode="admin" />;
}
