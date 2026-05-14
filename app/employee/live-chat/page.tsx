import type { Metadata } from "next";
import LiveChatDashboard from "@/components/chat/LiveChatDashboard";

export const metadata: Metadata = {
  title: "Live Chat | MXVL Employee",
  description: "Realtime support chat workspace."
};

export default function EmployeeLiveChatPage() {
  return <LiveChatDashboard mode="employee" />;
}

