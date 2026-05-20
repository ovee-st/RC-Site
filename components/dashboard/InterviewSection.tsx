"use client";

import { CalendarDays, CheckCircle2, Clock, Video } from "lucide-react";
import type { InterviewEvent } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

function timeUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return "Ready now";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days) return `${days}d ${hours % 24}h left`;
  return `${hours}h left`;
}

export default function InterviewSection({ interviews }: { interviews: InterviewEvent[] }) {
  return (
    <Card className="overflow-hidden p-4">
      <Badge variant="primary">Interview center</Badge>
      <h2 className="mt-1 text-lg font-black dark:text-white">Upcoming interviews</h2>
      <div className="mt-3 grid max-h-[230px] gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
        {interviews.map((interview) => (
          <div key={interview.id} className="rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black dark:text-white">{interview.role}</h3><p className="mt-0.5 text-xs text-text-muted dark:text-slate-300">{interview.company}</p></div><Badge variant="success">{timeUntil(interview.scheduledAt)}</Badge></div>
            <p className="mt-3 flex items-center gap-2 text-xs font-bold text-text-muted dark:text-slate-300"><CalendarDays className="h-3.5 w-3.5" /> {new Date(interview.scheduledAt).toLocaleString()}</p>
            <div className="mt-3 space-y-1.5">{interview.checklist.slice(0, 3).map((item) => <p key={item} className="line-clamp-1 text-xs text-text-muted dark:text-slate-300"><CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-success" />{item}</p>)}</div>
            <div className="mt-3 flex gap-2"><Button type="button" onClick={() => window.open(interview.meetingUrl, "_blank")} className="gap-1.5 px-3 py-2 text-xs"><Video className="h-3.5 w-3.5" /> Join</Button><Button type="button" variant="secondary" className="gap-1.5 px-3 py-2 text-xs"><Clock className="h-3.5 w-3.5" /> Mock</Button></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
