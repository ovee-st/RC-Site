import type { Metadata } from "next";
import LiveChatDashboard from "@/components/chat/LiveChatDashboard";

export const metadata: Metadata = {
  title: "Live Chat Session | MXVL Employee",
  description: "Realtime support chat session."
};

export default function EmployeeLiveChatSessionPage() {
  return <LiveChatDashboard mode="employee" />;
}
