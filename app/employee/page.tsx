import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Employee Support Desk | RC",
  description: "Internal RC employee ticket management workspace."
};

export default function EmployeeDashboardPage() {
  return <TicketCenter mode="employee" />;
}
