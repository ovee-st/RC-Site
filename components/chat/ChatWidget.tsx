"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Minus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useLiveChatStore } from "@/store/useLiveChatStore";
import { useLiveChatRealtime } from "@/hooks/useLiveChatRealtime";
import type { LiveChatSession } from "@/types/liveChat";
import ChatWindow from "@/components/chat/ChatWindow";

async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function ChatWidget() {
  const { user, role, loading } = useAuth();
  const { sessions, setSessions, activeSessionId, selectSession, upsertSession, addMessage } = useLiveChatStore();
  const [open, setOpen] = useState(false);

  const canUseChat = Boolean(user && (role === "candidate" || role === "employer"));
  const activeSession = useMemo(() => {
    const selected = sessions.find((session) => session.id === activeSessionId && session.status !== "ENDED");
    return selected || sessions.find((session) => session.status !== "ENDED") || null;
  }, [activeSessionId, sessions]);

  useLiveChatRealtime({
    channelKey: `widget-${user?.id || "guest"}`,
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

  if (loading || !canUseChat) return null;

  return (
    <div className="fixed bottom-24 right-5 z-50">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/92"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-primary">RC Live Support</p>
                <p className="text-sm font-bold text-text-muted">Realtime help linked to your ticket</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-text-muted transition hover:bg-slate-100 hover:text-text-main dark:hover:bg-white/10" aria-label="Minimize chat">
                <Minus className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[560px] max-h-[72vh] p-3">
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
        className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-elevated"
        aria-label="Open live chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {activeSession?.status === "WAITING" ? <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-white bg-amber-400" /> : null}
      </motion.button>
    </div>
  );
}


