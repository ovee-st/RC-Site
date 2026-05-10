"use client";

import type { LiveChatMessage } from "@/types/liveChat";
import { cn } from "@/lib/cn";

export default function ChatBubble({ message, mine }: { message: LiveChatMessage; mine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-soft",
        mine ? "rounded-br-md bg-primary text-white" : "rounded-bl-md border border-border bg-white text-text-main dark:border-white/10 dark:bg-slate-900 dark:text-white"
      )}>
        <p className="whitespace-pre-wrap leading-5">{message.message}</p>
        {message.attachment_url ? (
          <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block rounded-xl bg-white/15 px-3 py-2 text-xs font-black underline underline-offset-2">
            View attachment
          </a>
        ) : null}
        <p className={cn("mt-1 text-[10px] font-bold", mine ? "text-white/70" : "text-text-muted")}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  );
}

