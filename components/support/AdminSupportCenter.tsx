"use client";

import { useState } from "react";
import { MessageCircle, Ticket } from "lucide-react";
import LiveChatDashboard from "@/components/chat/LiveChatDashboard";
import TicketCenter from "@/components/support/TicketCenter";
import Card from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type SupportTab = "live-chat" | "tickets";

const tabs: Array<{ id: SupportTab; label: string; icon: any }> = [
  { id: "live-chat", label: "Live Chat", icon: MessageCircle },
  { id: "tickets", label: "Support Tickets", icon: Ticket }
];

export default function AdminSupportCenter() {
  const [activeTab, setActiveTab] = useState<SupportTab>("live-chat");

  return (
    <div className="grid gap-6">
      <Card className="rounded-3xl p-2">
        <div className="grid gap-2 sm:inline-grid sm:grid-cols-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition",
                  active
                    ? "bg-primary text-white shadow-primary"
                    : "text-text-muted hover:bg-primary/5 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5"
                )}
                aria-pressed={active}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {activeTab === "live-chat" ? <LiveChatDashboard mode="admin" compact /> : null}
      {activeTab === "tickets" ? <TicketCenter mode="admin" /> : null}
    </div>
  );
}
