"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FadeInSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
};

export default function FadeInSection({ children, className, delay = 0, as = "section" }: FadeInSectionProps) {
  const reduceMotion = useReducedMotion();
  const MotionTag = motion[as as "section"] || motion.section;

  return (
    <MotionTag
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={cn("relative", className)}
    >
      {children}
    </MotionTag>
  );
}
