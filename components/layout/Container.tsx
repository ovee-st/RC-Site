import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-container px-6", className)} {...props} />;
}
