import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Employee Support Desk | MXVL",
  description: "Internal MXVL employee ticket management workspace."
};

export default function EmployeeDashboardPage() {
  return <TicketCenter mode="employee" />;
}

