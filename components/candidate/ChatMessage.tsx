import { Bot } from "lucide-react";
import { cn } from "@/lib/cn";

export type CoachMessage = {
  role: "assistant" | "user";
  body: string;
  createdAt?: string;
};

export default function ChatMessage({ message }: { message: CoachMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10">
          <Bot className="h-3.5 w-3.5" />
        </span>
      ) : null}

      <div
        className={cn(
          "max-w-[78%] px-3.5 py-2.5 text-[12px] font-semibold leading-5 shadow-sm sm:max-w-[72%]",
          isUser
            ? "rounded-[20px] rounded-br-md bg-[#0866ff] text-white"
            : "rounded-[20px] rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
        )}
      >
        <p className="whitespace-pre-wrap">{message.body}</p>
        {message.createdAt ? (
          <p className={cn("mt-1 text-[10px] font-black", isUser ? "text-blue-100" : "text-slate-400 dark:text-slate-500")}>{message.createdAt}</p>
        ) : null}
      </div>
    </div>
  );
}
