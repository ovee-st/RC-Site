"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { fadeInVariants } from "@/components/motion/MotionSystem";

type CardProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  variant?: "default" | "interactive" | "highlighted";
  kind?: "content" | "metric" | "action" | "data" | "empty";
  interactive?: boolean;
};

const kindStyles = {
  content: "p-6",
  metric: "min-h-32 p-5",
  action: "p-5",
  data: "overflow-hidden p-0",
  empty: "border-dashed p-8 text-center"
};

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", kind = "content", interactive = false, ...props }, ref) => {
  const resolvedVariant = interactive ? "interactive" : variant;

  return (
  <motion.div
    ref={ref}
    variants={fadeInVariants}
    whileHover={resolvedVariant === "interactive" ? { scale: 1.02 } : undefined}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={cn(
      "depth-secondary rounded-card shadow-card transition-[border-color,box-shadow,transform] duration-200",
      kindStyles[kind],
      resolvedVariant === "interactive" && "cursor-pointer motion-safe:hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-hover",
      resolvedVariant === "highlighted" && "border-primary bg-primary/5 shadow-primary dark:bg-primary/10 dark:shadow-dark-primary",
      className
    )}
    {...props}
  />
  );
});

Card.displayName = "Card";

export default Card;
