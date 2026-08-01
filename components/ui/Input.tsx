import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const accessibleLabel = props["aria-label"] || props.placeholder;

  return (
    <input
      {...props}
      className={cn(
        "focus-ring min-h-11 w-full min-w-0 rounded-control border border-border bg-surface px-4 py-3 text-base font-medium text-text-main shadow-soft outline-none placeholder:font-normal placeholder:text-slate-400 hover:border-primary/30 focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-white/10 dark:bg-surface-dark dark:text-white dark:placeholder:text-slate-500 dark:disabled:bg-white/5 sm:text-sm",
        className
      )}
      aria-label={accessibleLabel}
    />
  );
}
