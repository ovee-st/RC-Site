import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
      "focus-ring min-h-11 w-full min-w-0 rounded-md border border-border bg-surface px-4 py-3 text-base font-medium text-text-main placeholder:text-text-muted shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white sm:text-sm",
        className
      )}
      {...props}
    />
  );
}
