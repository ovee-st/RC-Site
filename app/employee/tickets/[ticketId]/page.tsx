import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Employee Ticket Detail | RC",
  description: "Internal employee ticket details."
};

export default function EmployeeTicketDetailPage() {
  return <TicketCenter mode="employee" />;
}
