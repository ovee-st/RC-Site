"use client";

import { Paperclip, Send } from "lucide-react";
import type { RecruiterMessage } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function MessagingPanel({ threads }: { threads: RecruiterMessage[] }) {
  const active = threads[0];
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border p-5 dark:border-white/10"><Badge variant="primary">Messages</Badge><h2 className="mt-2 text-2xl font-black dark:text-white">Recruiter inbox</h2></div>
      <div className="grid min-h-[520px] lg:grid-cols-[280px_1fr]">
        <div className="border-r border-border p-3 dark:border-white/10">
          {threads.map((thread) => <button key={thread.id} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-primary/5"><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-black text-white">{thread.recruiter.slice(0,2).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-black dark:text-white">{thread.recruiter}</p><p className="truncate text-xs text-text-muted dark:text-slate-300">{thread.lastMessage}</p></div>{thread.unread ? <Badge variant="primary">{thread.unread}</Badge> : null}</button>)}
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="border-b border-border p-4 dark:border-white/10"><p className="font-black dark:text-white">{active.recruiter}</p><p className="text-sm text-text-muted dark:text-slate-300">{active.company} · typing indicator enabled</p></div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5">{active.messages.map((message) => <div key={message.id} className={`flex ${message.sender === "candidate" ? "justify-end" : "justify-start"}`}><div className={`max-w-[76%] rounded-2xl px-4 py-3 text-sm font-semibold ${message.sender === "candidate" ? "bg-primary text-white" : "bg-bg text-text-muted dark:bg-white/5 dark:text-slate-200"}`}>{message.body}<p className="mt-2 text-[10px] opacity-70">{message.timestamp}</p></div></div>)}</div>
          <div className="flex gap-3 border-t border-border p-4 dark:border-white/10"><button className="rounded-xl border border-border p-3 text-text-muted dark:border-white/10"><Paperclip className="h-4 w-4" /></button><input className="focus-ring min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-900 dark:text-white" placeholder="Write a message..." /><Button className="gap-2"><Send className="h-4 w-4" /> Send</Button></div>
        </div>
      </div>
    </Card>
  );
}
