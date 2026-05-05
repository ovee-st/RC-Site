"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 450);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Go to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface text-primary shadow-elevated transition hover:-translate-y-1 hover:border-primary/30 dark:border-white/10 dark:bg-slate-900"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}