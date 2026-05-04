import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const variants = {
  top: "border-success/25 bg-success/10 text-success shadow-[0_0_28px_rgba(34,197,94,0.18)] dark:bg-success/15 dark:text-emerald-300",
  urgent: "border-orange-400/25 bg-orange-400/10 text-orange-600 shadow-[0_0_26px_rgba(251,146,60,0.18)] dark:bg-orange-400/15 dark:text-orange-300",
  new: "border-primary/25 bg-primary/10 text-primary shadow-[0_0_24px_rgba(37,99,235,0.16)] dark:bg-primary/15 dark:text-blue-300",
  stale: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800 dark:text-slate-100",
  review: "border-amber-400/25 bg-amber-400/10 text-amber-700 shadow-[0_0_26px_rgba(251,191,36,0.14)] dark:bg-amber-400/15 dark:text-amber-300",
  fast: "border-cyan-400/25 bg-cyan-400/10 text-cyan-700 shadow-[0_0_26px_rgba(34,211,238,0.16)] dark:bg-cyan-400/15 dark:text-cyan-300"
};

const labels = {
  top: "🔥 Top match",
  urgent: "Urgent candidate",
  new: "New applicant",
  stale: "Stale job",
  review: "⚠ Needs review",
  fast: "🚀 Fast moving candidate"
};

type PriorityIndicatorProps = HTMLAttributes<HTMLSpanElement> & {
  variant: keyof typeof variants;
  pulse?: boolean;
};

export default function PriorityIndicator({
  variant,
  pulse = false,
  className,
  children,
  ...props
}: PriorityIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold leading-none",
        variants[variant],
        pulse && "animate-pulse",
        className
      )}
      {...props}
    >
      {variant === "new" ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
      {children || labels[variant]}
    </span>
  );
}
