"use client";

import { BellRing, Briefcase, CalendarClock, Filter, Sparkles } from "lucide-react";
import type { CandidateNotification } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const icons = { application: Briefcase, interview: CalendarClock, message: BellRing, ai: Sparkles };

export default function NotificationsPanel({ notifications }: { notifications: CandidateNotification[] }) {
  return (
    <Card className="h-[340px] overflow-hidden p-4">
      <div className="flex items-start justify-between gap-4"><div><Badge variant="primary">Notifications</Badge><h2 className="mt-1 text-lg font-black dark:text-white">Notification center</h2></div><button className="rounded-xl border border-border p-2 text-text-muted dark:border-white/10"><Filter className="h-4 w-4" /></button></div>
      <div className="mt-4 max-h-[260px] space-y-2 overflow-y-auto pr-1">
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          return (
            <div key={notification.id} className={`flex gap-3 rounded-2xl border p-3 ${notification.isRead ? "border-border bg-bg dark:border-white/10 dark:bg-white/5" : "border-primary/20 bg-primary/5"}`}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
              <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-black dark:text-white">{notification.title}</p>{!notification.isRead ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 line-clamp-2 text-xs text-text-muted dark:text-slate-300">{notification.message}</p><p className="mt-1.5 text-[11px] font-bold text-text-muted dark:text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
