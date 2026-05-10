import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Employee Tickets | RC",
  description: "Internal employee ticket queue."
};

export default function EmployeeTicketsPage() {
  return <TicketCenter mode="employee" />;
}
