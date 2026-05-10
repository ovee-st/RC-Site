import type { Metadata } from "next";
import LiveChatDashboard from "@/components/chat/LiveChatDashboard";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Tickets | RC Admin",
  description: "Admin support ticket and live chat management."
};

export default function AdminSupportTicketsPage() {
  return (
    <div className="grid gap-8">
      <LiveChatDashboard mode="admin" compact />
      <TicketCenter mode="admin" />
    </div>
  );
}
