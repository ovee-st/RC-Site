"use client";

import { BarChart3, Bell, Briefcase, CalendarClock, FileText, Home, MessageSquare, Sparkles, UserRound, Zap } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { id: "home", label: "Home", icon: Home },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "applications", label: "Applications", icon: Briefcase },
  { id: "assistant", label: "AI Assistant", icon: Sparkles },
  { id: "assessments", label: "Assessments", icon: Zap },
  { id: "interviews", label: "Interviews", icon: CalendarClock },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 }
];

export default function Sidebar({ activeSection, onNavigate }: { activeSection: string; onNavigate: (id: string) => void }) {
  return (
    <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-72 shrink-0 rounded-3xl border border-border bg-surface/80 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 lg:block">
      <div className="mb-5 rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-4 text-white shadow-[0_18px_45px_rgba(37,99,235,0.25)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">RC Candidate</p>
        <h2 className="mt-2 text-xl font-black">Career Command Center</h2>
        <p className="mt-1 text-sm text-white/75">AI-guided hiring workflow</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-text-muted transition hover:bg-primary/5 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5",
                active && "bg-primary/10 text-primary shadow-soft dark:bg-primary/15 dark:text-blue-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
