import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Employee Profile | MXVL",
  description: "Employee support profile."
};

export default function EmployeeProfilePage() {
  return <TicketCenter mode="employee" />;
}

