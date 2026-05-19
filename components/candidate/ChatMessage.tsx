import { Bot, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

export type CoachMessage = {
  role: "assistant" | "user";
  body: string;
  createdAt?: string;
};

export default function ChatMessage({ message }: { message: CoachMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className={cn(
        "max-w-[82%] rounded-2xl px-3 py-2 text-xs font-semibold leading-5 shadow-soft",
        isUser
          ? "bg-primary text-white"
          : "border border-border bg-surface text-text-muted dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
      )}>
        <p>{message.body}</p>
        {message.createdAt ? <p className={cn("mt-1 text-[10px]", isUser ? "text-white/70" : "text-text-muted")}>{message.createdAt}</p> : null}
      </div>
      {isUser ? (
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-success/10 text-success">
          <UserRound className="h-3.5 w-3.5" />
        </span>
      ) : null}
    </div>
  );
}
