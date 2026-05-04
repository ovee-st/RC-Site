import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
      "focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-main shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white",
        className
      )}
      {...props}
    />
  );
}
