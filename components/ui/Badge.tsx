import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variants = {
  neutral: "border-border bg-bg text-text-muted dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100",
  success: "border-success/20 bg-success/10 text-success dark:border-success/25 dark:bg-success/15 dark:text-emerald-300",
  primary: "border-primary/20 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15 dark:text-blue-300",
  warning: "border-amber-300/50 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200",
  review: "border-violet-300/50 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-200",
  draft: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
  inactive: "border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
  danger: "border-danger/20 bg-danger/10 text-danger dark:border-danger/25 dark:bg-danger/15 dark:text-red-300",
  "match-score": "border-success/20 bg-success/10 text-success dark:border-success/25 dark:bg-success/15 dark:text-emerald-300"
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export default function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none shadow-[0_1px_1px_rgba(15,23,42,0.04)]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
