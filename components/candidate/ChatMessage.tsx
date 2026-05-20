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
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10">
          <Bot className="h-4 w-4" />
        </span>
      ) : null}

      <div
        className={cn(
          "max-w-[86%] break-words px-4 py-3 text-[13px] font-semibold leading-6 shadow-sm sm:max-w-[78%]",
          isUser
            ? "rounded-[22px] rounded-br-md bg-[#0866ff] text-white"
            : "rounded-[22px] rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
        )}
      >
        <p className={cn("whitespace-pre-wrap !text-inherit", isUser ? "!text-white" : "!text-slate-800 dark:!text-slate-100")}>{message.body}</p>
        {message.createdAt ? (
          <p className={cn("mt-1 text-[10px] font-black !text-inherit", isUser ? "!text-blue-100" : "!text-slate-500 dark:!text-slate-400")}>{message.createdAt}</p>
        ) : null}
      </div>
    </div>
  );
}
