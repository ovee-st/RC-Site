import type { Metadata } from "next";
import SupportOperationsCenter from "@/components/support/SupportOperationsCenter";

export const metadata: Metadata = {
  title: "Support Ticket | MXVL"
};

export default function SupportTicketDetailPage() {
  return <SupportOperationsCenter view="tickets" />;
}
