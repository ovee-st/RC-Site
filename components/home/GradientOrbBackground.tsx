"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function GradientOrbBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(220,38,38,0.10),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#eef4ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(220,38,38,0.16),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#111827_100%)]" />
      <motion.div
        className="absolute left-[8%] top-24 h-72 w-72 rounded-full bg-blue-400/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 36, -18, 0], y: [0, -18, 28, 0], opacity: [0.45, 0.85, 0.55] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[7%] top-36 h-80 w-80 rounded-full bg-red-400/15 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -28, 16, 0], y: [0, 20, -22, 0], opacity: [0.35, 0.7, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.10]" />
    </div>
  );
}
