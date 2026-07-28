import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  blue: "border-blue-200/70 bg-blue-50 text-blue-600 dark:border-blue-400/15 dark:bg-blue-950/40 dark:text-blue-300",
  emerald: "border-emerald-200/70 bg-emerald-50 text-emerald-600 dark:border-emerald-400/15 dark:bg-emerald-950/40 dark:text-emerald-300",
  violet: "border-violet-200/70 bg-violet-50 text-violet-600 dark:border-violet-400/15 dark:bg-violet-950/40 dark:text-violet-300",
  cyan: "border-cyan-200/70 bg-cyan-50 text-cyan-700 dark:border-cyan-400/15 dark:bg-cyan-950/40 dark:text-cyan-300",
  amber: "border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-400/15 dark:bg-amber-950/40 dark:text-amber-300",
  slate: "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200"
};

type IconTileProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: keyof typeof tones;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-9 w-9 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
  md: "h-11 w-11 rounded-xl [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-12 w-12 rounded-xl [&_svg]:h-6 [&_svg]:w-6"
};

export default function IconTile({ children, tone = "blue", size = "md", className, ...props }: IconTileProps) {
  return (
    <span
      className={cn("grid shrink-0 place-items-center border shadow-[0_1px_2px_rgba(15,23,42,0.04)]", tones[tone], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
