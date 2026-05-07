import type { Metadata } from "next";
import TicketCenter from "@/components/support/TicketCenter";

export const metadata: Metadata = {
  title: "Support Center | RC",
  description: "Create and track RC support tickets."
};

export default function SupportPage() {
  return <TicketCenter mode="user" />;
}
