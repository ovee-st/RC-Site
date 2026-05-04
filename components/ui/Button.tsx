"use client";

import Link from "next/link";
import { AnchorHTMLAttributes, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

const base =
  "focus-ring inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium outline-none transition disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md",
  secondary: "border border-border bg-bg text-text-main shadow-soft hover:border-primary/25 hover:bg-surface hover:text-primary hover:shadow-hover dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-blue-400/40 dark:hover:bg-slate-800",
  ghost: "text-text-muted shadow-none hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-blue-300",
  success: "bg-gradient-to-r from-success to-emerald-600 text-white shadow-soft hover:shadow-[0_12px_34px_rgba(34,197,94,0.24)]",
  chip: "border border-border bg-bg px-4 py-2 text-text-muted shadow-none hover:border-primary/25 hover:text-primary dark:border-slate-600/70 dark:bg-slate-800/80 dark:text-slate-100",
  tab: "text-text-muted shadow-none hover:bg-primary/5 hover:text-primary dark:text-slate-200 dark:hover:text-blue-300"
};

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: keyof typeof variants;
};

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}

export function LinkButton({ href, className, variant = "primary", children, ...props }: LinkButtonProps) {
  return (
    <motion.span whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.16, ease: "easeOut" }} className="inline-flex">
      <Link href={href} className={cn(base, variants[variant], className)} {...props}>
        {children}
      </Link>
    </motion.span>
  );
}
