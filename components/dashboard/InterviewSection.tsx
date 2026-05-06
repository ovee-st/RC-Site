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
    <Card className="p-6">
      <Badge variant="primary">Interview center</Badge>
      <h2 className="mt-2 text-2xl font-black dark:text-white">Upcoming interviews</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {interviews.map((interview) => (
          <div key={interview.id} className="rounded-3xl border border-border bg-bg p-5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-black dark:text-white">{interview.role}</h3><p className="mt-1 text-sm text-text-muted dark:text-slate-300">{interview.company}</p></div><Badge variant="success">{timeUntil(interview.scheduledAt)}</Badge></div>
            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-text-muted dark:text-slate-300"><CalendarDays className="h-4 w-4" /> {new Date(interview.scheduledAt).toLocaleString()}</p>
            <div className="mt-4 space-y-2">{interview.checklist.map((item) => <p key={item} className="text-sm text-text-muted dark:text-slate-300"><CheckCircle2 className="mr-2 inline h-4 w-4 text-success" />{item}</p>)}</div>
            <div className="mt-5 flex gap-3"><Button type="button" onClick={() => window.open(interview.meetingUrl, "_blank")} className="gap-2"><Video className="h-4 w-4" /> Join</Button><Button type="button" variant="secondary" className="gap-2"><Clock className="h-4 w-4" /> Mock interview</Button></div>
          </div>
        ))}
      </div>
    </Card>
  );
}
