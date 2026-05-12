"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle, PhoneOff, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { formatLiveChatStatus } from "@/lib/liveChat";
import { useLiveChatStore } from "@/store/useLiveChatStore";
import type { LiveChatMessage, LiveChatSession } from "@/types/liveChat";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ChatBubble from "@/components/chat/ChatBubble";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";

async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function ChatWindow({ sessionId, mode = "user", onSessionChange }: { sessionId?: string | null; mode?: "user" | "employee" | "admin"; onSessionChange?: (session: LiveChatSession) => void }) {
  const { user, role } = useAuth();
  const { sessions, messagesBySession, setMessages, addMessage, upsertSession, selectSession } = useLiveChatStore();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeSession = useMemo(() => sessions.find((session) => session.id === sessionId) || null, [sessions, sessionId]);
  const messages = sessionId ? messagesBySession[sessionId] || [] : [];


  useEffect(() => {
    if (!sessionId || !isSupabaseConfigured) return;
    let active = true;
    authHeaders().then((headers) => fetch(`/api/live-chat/${sessionId}/messages`, { headers })).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (active && response.ok) setMessages(sessionId, (payload.messages || []) as LiveChatMessage[]);
    });
    return () => { active = false; };
  }, [sessionId, setMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function startChat() {
    setStarting(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ message: "Hi, I need help with RC." })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not start live chat.");
      upsertSession(payload.session);
      selectSession(payload.session.id);
      onSessionChange?.(payload.session);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Could not start live chat.");
    } finally {
      setStarting(false);
    }
  }

  async function sendMessage(message: string, file?: File | null) {
    if (!sessionId) return;
    const headers = await authHeaders();
    let attachment_url: string | null = null;

    if (file && isSupabaseConfigured) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `live-chat/${sessionId}/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from("support-attachments").upload(path, file, { upsert: false });
      if (!upload.error) {
        const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
        attachment_url = data.publicUrl;
      }
    }

    const response = await fetch(`/api/live-chat/${sessionId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ message, attachment_url })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.message) addMessage(payload.message);
  }

  async function endChat() {
    if (!sessionId) return;
    const headers = await authHeaders();
    const response = await fetch(`/api/live-chat/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "end" })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.session) upsertSession(payload.session);
  }

  if (!sessionId || !activeSession) {
    if (mode !== "user") {
      return (
        <div className="grid min-h-[360px] place-items-center rounded-3xl border border-border bg-white p-8 text-center shadow-elevated dark:border-white/10 dark:bg-slate-950">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-black text-text-main dark:text-white">Select a live chat</h3>
            <p className="mt-2 max-w-sm text-sm font-semibold text-text-muted">
              Waiting and active conversations will open here for support follow-up.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 rounded-3xl border border-border bg-white p-5 shadow-elevated dark:border-white/10 dark:bg-slate-950">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black text-text-main dark:text-white">Live support</h3>
          <p className="mt-1 text-sm font-semibold text-text-muted">Start a realtime conversation. If no agent is online, we will keep it as a support ticket.</p>
        </div>
        {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600">{error}</p> : null}
        <Button onClick={startChat} disabled={starting} className="gap-2">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Start conversation
        </Button>
      </div>
    );
  }

  const mine = (message: LiveChatMessage) => message.sender_id === user?.id;
  const ended = activeSession.status === "ENDED";

  return (
    <div className="flex h-full min-h-[460px] flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-elevated dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-white/80 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div>
          <p className="type-label text-primary">Live Chat</p>
          <h3 className="text-base font-black text-text-main dark:text-white">{mode === "user" ? "RC Support" : activeSession.username || "Customer"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={activeSession.status === "ACTIVE" ? "success" : activeSession.status === "ENDED" ? "neutral" : "primary"}>{formatLiveChatStatus(activeSession.status)}</Badge>
          {!ended ? (
            <button type="button" onClick={endChat} className="rounded-full p-2 text-text-muted transition hover:bg-red-50 hover:text-red-600" aria-label="End chat">
              <PhoneOff className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-900 dark:to-slate-950">
        {messages.map((message) => <ChatBubble key={message.id} message={message} mine={mine(message)} />)}
        {activeSession.status === "WAITING" ? <TypingIndicator label="Waiting for an available support agent" /> : null}
      </div>
      <div className="border-t border-border p-3 dark:border-white/10">
        <MessageInput disabled={ended} onSend={sendMessage} placeholder={ended ? "This chat has ended." : String(role) === "employee" || String(role) === "admin" ? "Reply to customer..." : "Message support..."} />
      </div>
    </div>
  );
}





