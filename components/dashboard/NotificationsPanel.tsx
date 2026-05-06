"use client";

import { BellRing, Briefcase, CalendarClock, Filter, Sparkles } from "lucide-react";
import type { CandidateNotification } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const icons = { application: Briefcase, interview: CalendarClock, message: BellRing, ai: Sparkles };

export default function NotificationsPanel({ notifications }: { notifications: CandidateNotification[] }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4"><div><Badge variant="primary">Notifications</Badge><h2 className="mt-2 text-2xl font-black dark:text-white">Notification center</h2></div><button className="rounded-xl border border-border p-2 text-text-muted dark:border-white/10"><Filter className="h-4 w-4" /></button></div>
      <div className="mt-6 space-y-3">
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <div key={notification.id} className={`flex gap-3 rounded-2xl border p-4 ${notification.isRead ? "border-border bg-bg dark:border-white/10 dark:bg-white/5" : "border-primary/20 bg-primary/5"}`}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-black dark:text-white">{notification.title}</p>{!notification.isRead ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 text-sm text-text-muted dark:text-slate-300">{notification.message}</p><p className="mt-2 text-xs font-bold text-text-muted dark:text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
