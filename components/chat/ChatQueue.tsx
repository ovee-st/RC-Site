"use client";

import { MessageCircle, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LiveChatSession } from "@/types/liveChat";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatLiveChatStatus } from "@/lib/liveChat";
import { cn } from "@/lib/cn";

const QUEUE_WINDOW_SIZE = 75;

export default function ChatQueue({ sessions, selectedId, onSelect, onAccept }: { sessions: LiveChatSession[]; selectedId?: string | null; onSelect: (sessionId: string) => void; onAccept?: (sessionId: string) => void }) {
  const [visibleCount, setVisibleCount] = useState(QUEUE_WINDOW_SIZE);
  const visibleSessions = useMemo(() => sessions.slice(0, visibleCount), [sessions, visibleCount]);

  useEffect(() => {
    setVisibleCount(QUEUE_WINDOW_SIZE);
  }, [sessions.length]);

  return (
    <div className="grid gap-3">
      {sessions.length ? visibleSessions.map((session) => (
        <button
          key={session.id}
          type="button"
          onClick={() => onSelect(session.id)}
          className={cn(
            "rounded-2xl border p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30",
            selectedId === session.id ? "border-primary bg-primary/5" : "border-border bg-white dark:border-white/10 dark:bg-slate-900"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-text-main dark:text-white">{session.username || "Customer"}</p>
              <p className="mt-1 text-xs font-bold text-text-muted">{session.user_role} - Started {new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <Badge variant={session.status === "ACTIVE" ? "success" : session.status === "ENDED" ? "neutral" : "primary"}>{formatLiveChatStatus(session.status)}</Badge>
          </div>
          {session.status === "WAITING" && onAccept ? (
            <Button type="button" onClick={(event) => { event.stopPropagation(); onAccept(session.id); }} className="mt-3 w-full gap-2 px-3 py-2">
              <UserCheck className="h-4 w-4" />
              Accept chat
            </Button>
          ) : null}
        </button>
      )) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center dark:border-white/10">
          <MessageCircle className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-black text-text-main dark:text-white">No live chats yet</p>
          <p className="mt-1 text-xs font-semibold text-text-muted">New waiting and active sessions will appear here instantly.</p>
        </div>
      )}
      {visibleCount < sessions.length ? (
        <Button type="button" variant="secondary" onClick={() => setVisibleCount((count) => count + QUEUE_WINDOW_SIZE)} className="w-full">
          Show more chats
        </Button>
      ) : null}
    </div>
  );
}
