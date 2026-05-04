import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-section", className)} {...props} />;
}
