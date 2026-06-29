import type { Metadata } from "next";
import AdminSupportCenter from "@/components/support/AdminSupportCenter";

export const metadata: Metadata = {
  title: "Support Tickets | MXVL Admin",
  description: "Admin support ticket and live chat management."
};

export default function AdminSupportTicketsPage() {
  return <AdminSupportCenter />;
}

