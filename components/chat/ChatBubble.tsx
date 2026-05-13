"use client";

import type { LiveChatMessage } from "@/types/liveChat";
import { cn } from "@/lib/cn";

export default function ChatBubble({ message, mine }: { message: LiveChatMessage; mine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-soft",
        mine
          ? "rounded-br-md bg-gradient-to-br from-blue-600 to-primary text-white"
          : "rounded-bl-md border border-border bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white"
      )}>
        <p className={cn("whitespace-pre-wrap leading-5", mine ? "text-white" : "text-slate-900 dark:text-white")}>{message.message}</p>
        {message.attachment_url ? (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "mt-2 block rounded-xl px-3 py-2 text-xs font-black underline underline-offset-2",
              mine ? "bg-white/15 text-white" : "bg-slate-100 text-primary dark:bg-white/10 dark:text-blue-200"
            )}
          >
            View attachment
          </a>
        ) : null}
        <p className={cn("mt-1 text-[10px] font-bold", mine ? "text-blue-100" : "text-slate-500 dark:text-slate-300")}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  );
}

