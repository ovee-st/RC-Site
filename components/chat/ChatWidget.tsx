"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { useLiveChatStore } from "@/store/useLiveChatStore";
import { useLiveChatRealtime } from "@/hooks/useLiveChatRealtime";
import type { LiveChatSession } from "@/types/liveChat";
import ChatWindow from "@/components/chat/ChatWindow";

const CHAT_WIDGET_STATE_EVENT = "mx-live-chat-state";

async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  return compactAuthHeaders("LIVE_CHAT_WIDGET");
}

export default function ChatWidget() {
  const { user, role, loading } = useAuth();
  const { sessions, setSessions, activeSessionId, selectSession, upsertSession, addMessage } = useLiveChatStore();
  const [open, setOpen] = useState(false);

  const canUseChat = Boolean(user && role === "employer");
  const activeSession = useMemo(() => {
    const selected = sessions.find((session) => session.id === activeSessionId && session.status !== "ENDED");
    return selected || sessions.find((session) => session.status !== "ENDED") || null;
  }, [activeSessionId, sessions]);

  useLiveChatRealtime({
    channelKey: `widget-${user?.id || "guest"}`,
    messageSessionId: activeSession?.id || null,
    sessionFilter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onSessionChange: upsertSession,
    onMessageCreate: addMessage
  });

  useEffect(() => {
    if (!canUseChat || !isSupabaseConfigured) return;
    let active = true;
    authHeaders().then((headers) => fetch("/api/live-chat", { headers })).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!active || !response.ok) return;
      const rows = (payload.sessions || []) as LiveChatSession[];
      setSessions(rows);
      const openSession = rows.find((session) => session.status !== "ENDED");
      if (openSession) selectSession(openSession.id);
    });
    return () => { active = false; };
  }, [canUseChat, selectSession, setSessions]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(CHAT_WIDGET_STATE_EVENT, { detail: { open } }));
    return () => {
      window.dispatchEvent(new CustomEvent(CHAT_WIDGET_STATE_EVENT, { detail: { open: false } }));
    };
  }, [open]);

  if (loading || !canUseChat) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 sm:inset-x-auto sm:bottom-24 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 w-full overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-950 sm:w-[360px]"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3.5 dark:border-white/10 dark:bg-slate-950">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-soft">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">Live Support</p>
                  <p className="truncate text-[11px] font-bold text-emerald-600 dark:text-emerald-300">{activeSession?.status === "ACTIVE" ? "Support is online" : activeSession?.status === "WAITING" ? "Waiting for support" : "Usually replies in a few minutes"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Minimize chat">
                <Minus className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[min(72dvh,500px)] min-h-[420px] bg-slate-50 dark:bg-slate-900 sm:h-[500px] sm:max-h-[calc(100vh-120px)] sm:min-h-0">
              <ChatWindow sessionId={activeSession?.id || null} mode="user" onSessionChange={(session) => { upsertSession(session); selectSession(session.id); }} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.button
        type="button"
        whileHover={{ y: -2, scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((value) => !value)}
        className="relative ml-auto grid h-14 w-14 place-items-center rounded-full bg-[#0866ff] text-white shadow-[0_12px_30px_rgba(8,102,255,0.35)] transition sm:ml-0"
        aria-label="Open live chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {activeSession?.status === "WAITING" ? <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-amber-400" /> : null}
      </motion.button>
    </div>
  );
}
