import { cn } from "@/lib/cn";
import type { SupportTicketPriority } from "@/types/support";

const classes: Record<string, string> = {
  URGENT: "border-red-200 bg-red-50 text-red-600 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300",
  HIGH: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
  MEDIUM: "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300",
  LOW: "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
};

export default function PriorityBadge({ priority, className }: { priority: SupportTicketPriority | string; className?: string }) {
  const normalized = String(priority || "MEDIUM").toUpperCase();
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", classes[normalized] || classes.MEDIUM, className)}>{normalized}</span>;
}
