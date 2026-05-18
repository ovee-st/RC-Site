"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
};

export default function AnimatedCounter({ value, suffix = "", prefix = "", duration = 1.2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const controls = animate(motionValue, value, { duration, ease: "easeOut" });
    const unsubscribe = motionValue.on("change", (latest) => setDisplay(Math.round(latest)));

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [duration, inView, motionValue, reduceMotion, value]);

  return (
    <span ref={ref}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}
