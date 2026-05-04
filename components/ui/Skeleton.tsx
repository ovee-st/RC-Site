import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-text-muted/15 after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:animate-shimmer dark:bg-white/10 dark:after:via-white/10",
        className
      )}
      {...props}
    />
  );
}
