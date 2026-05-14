import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Center | MXVL",
  description: "Create and track Live Support tickets."
};

export default function SupportPage() {
  return <TicketCenter mode="user" />;
}

