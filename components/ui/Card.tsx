"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { fadeInVariants } from "@/components/motion/MotionSystem";

type CardProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  variant?: "default" | "interactive" | "highlighted";
  interactive?: boolean;
};

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", interactive = false, ...props }, ref) => {
  const resolvedVariant = interactive ? "interactive" : variant;

  return (
  <motion.div
    ref={ref}
    variants={fadeInVariants}
    whileHover={resolvedVariant === "interactive" ? { scale: 1.02 } : undefined}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={cn(
      "depth-secondary rounded-xl p-6 transition",
      resolvedVariant === "interactive" && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-hover",
      resolvedVariant === "highlighted" && "border-primary bg-primary/5 shadow-primary dark:bg-primary/10 dark:shadow-dark-primary",
      className
    )}
    {...props}
  />
  );
});

Card.displayName = "Card";

export default Card;
