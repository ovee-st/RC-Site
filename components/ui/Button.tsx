import Link from "next/link";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "focus-ring inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-control px-5 py-2.5 text-center text-sm font-semibold leading-5 outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "border border-blue-600 bg-blue-600 text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_8px_20px_rgba(37,99,235,0.16)] hover:border-blue-700 hover:bg-blue-700 hover:shadow-[0_2px_4px_rgba(15,23,42,0.12),0_12px_26px_rgba(37,99,235,0.22)]",
  secondary: "border border-border bg-surface text-text-main shadow-soft hover:border-primary/30 hover:bg-white hover:text-primary hover:shadow-hover dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-blue-400/40 dark:hover:bg-slate-800",
  ghost: "border border-transparent text-text-muted shadow-none hover:bg-primary/[0.06] hover:text-primary dark:text-slate-200 dark:hover:bg-white/[0.06] dark:hover:text-blue-300",
  success: "border border-emerald-600 bg-emerald-600 text-white shadow-soft hover:border-emerald-700 hover:bg-emerald-700 hover:shadow-[0_12px_30px_rgba(5,150,105,0.20)]",
  chip: "border border-border bg-surface px-4 py-2 text-text-muted shadow-soft hover:border-primary/30 hover:text-primary dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100",
  tab: "border border-transparent text-text-muted shadow-none hover:bg-primary/[0.06] hover:text-primary dark:text-slate-200 dark:hover:bg-white/[0.06] dark:hover:text-blue-300"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  loading?: boolean;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", loading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ href, className, variant = "primary", children, ...props }: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Link>
  );
}
