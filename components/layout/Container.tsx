import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full min-w-0 max-w-container px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
