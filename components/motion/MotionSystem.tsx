"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04
    }
  }
};

export function FadeIn({ className, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="show"
      className={className}
      {...props}
    />
  );
}

export function ScaleHover({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div whileHover={{ scale: 1.02 }} className={className} {...props} />;
}

export function StaggerContainer({ children, className, ...props }: HTMLMotionProps<"div"> & { children: ReactNode }) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
