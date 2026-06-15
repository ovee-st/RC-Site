"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/cn";

const CHAT_WIDGET_STATE_EVENT = "mx-live-chat-state";

export default function BackToTopButton() {
  const { role } = useAuth();
  const [visible, setVisible] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const hasEmployerChat = role === "employer";

  useEffect(() => {
    const updateVisibility = () => {
      const canScroll = document.documentElement.scrollHeight > window.innerHeight + 240;
      setVisible(canScroll && window.scrollY > 420);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);
    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const handleChatState = (event: Event) => {
      setChatOpen(Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open));
    };

    window.addEventListener(CHAT_WIDGET_STATE_EVENT, handleChatState);
    return () => window.removeEventListener(CHAT_WIDGET_STATE_EVENT, handleChatState);
  }, []);

  return (
    <AnimatePresence>
      {visible && !chatOpen ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.94 }}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "fixed right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-primary shadow-elevated transition hover:border-primary/30 hover:bg-primary hover:text-white dark:border-white/10 dark:bg-slate-950 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:bg-blue-600 dark:hover:text-white",
            hasEmployerChat ? "bottom-44" : "bottom-24"
          )}
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
