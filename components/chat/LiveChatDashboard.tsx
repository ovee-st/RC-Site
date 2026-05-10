"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Radio, ShieldCheck, Timer, UsersRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useLiveChatRealtime } from "@/hooks/useLiveChatRealtime";
import { useLiveChatStore } from "@/store/useLiveChatStore";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import ChatQueue from "@/components/chat/ChatQueue";
import ChatWindow from "@/components/chat/ChatWindow";
import type { LiveChatSession } from "@/types/liveChat";

async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function LiveChatDashboard({ mode = "employee", compact = false }: { mode?: "employee" | "admin"; compact?: boolean }) {
  const { user, role, loading } = useAuth();
  const { sessions, setSessions, upsertSession, activeSessionId, selectSession, addMessage } = useLiveChatStore();
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLiveChatRealtime({
    channelKey: `${mode}-${user?.id || "guest"}`,
    onSessionChange: upsertSession,
    onMessageCreate: addMessage
  });

  useEffect(() => {
    if (loading) return;
    if (!user || !isSupabaseConfigured) {
      setDataLoading(false);
      return;
    }

    let active = true;
    setDataLoading(true);
    authHeaders()
      .then((headers) => fetch("/api/live-chat", { headers }))
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok) throw new Error(payload.error || "Could not load live chats.");
        const rows = (payload.sessions || []) as LiveChatSession[];
        setSessions(rows);
        if (rows[0]) selectSession(rows[0].id);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load live chats."))
      .finally(() => active && setDataLoading(false));

    return () => { active = false; };
  }, [loading, selectSession, setSessions, user]);

  const roleValue = String(role || "");
  const authorized = roleValue === "employee" || roleValue === "admin" || roleValue === "viewer";
  const stats = useMemo(() => ({
    waiting: sessions.filter((session) => session.status === "WAITING").length,
    active: sessions.filter((session) => session.status === "ACTIVE").length,
    ended: sessions.filter((session) => session.status === "ENDED").length,
    assigned: sessions.filter((session) => session.employee_id === user?.id && session.status === "ACTIVE").length
  }), [sessions, user?.id]);

  async function acceptChat(sessionId: string) {
    const headers = await authHeaders();
    const response = await fetch(`/api/live-chat/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ action: "accept" })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.session) {
      upsertSession(payload.session);
      selectSession(payload.session.id);
    }
  }

  if (loading || dataLoading) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-6">
        <Card className="flex items-center gap-3 rounded-3xl p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-bold text-text-muted">Loading live chat console...</span>
        </Card>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-6">
        <Card className="max-w-md rounded-3xl p-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 text-2xl font-black text-text-main dark:text-white">Access restricted</h1>
          <p className="mt-2 text-sm font-semibold text-text-muted">Live chat is only available to RC support employees and admins.</p>
        </Card>
      </main>
    );
  }

  return (
    <section className={compact ? "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6" : "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6"}>
      <div className="mb-6 grid gap-4 rounded-[2rem] border border-white/60 bg-white/82 p-5 shadow-elevated backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75 lg:grid-cols-[1fr_auto]">
        <div>
          <Badge variant="primary" className="type-label">Realtime Support</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl">Live chat command center</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">Accept waiting chats, respond instantly, and keep every conversation linked to its support ticket.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4 lg:min-w-[560px]">
          {[
            { label: "Waiting", value: stats.waiting, icon: Timer },
            { label: "Active", value: stats.active, icon: Radio },
            { label: "Assigned", value: stats.assigned, icon: UsersRound },
            { label: "Ended", value: stats.ended, icon: MessageCircle }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-2xl p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-2xl font-black text-text-main dark:text-white">{item.value}</p>
                <p className="text-xs font-bold text-text-muted">{item.label}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {error ? <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="rounded-3xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="type-label text-primary">Queue</p>
              <h2 className="text-xl font-black text-text-main dark:text-white">Waiting and active chats</h2>
            </div>
            <Badge>{sessions.filter((session) => session.status !== "ENDED").length}</Badge>
          </div>
          <div className="max-h-[650px] overflow-y-auto pr-1">
            <ChatQueue sessions={sessions.filter((session) => session.status !== "ENDED")} selectedId={activeSessionId} onSelect={selectSession} onAccept={acceptChat} />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <ChatWindow sessionId={activeSessionId} mode={mode} />
          <Card className="rounded-3xl p-5">
            <p className="type-label text-primary">Customer context</p>
            {activeSessionId ? (
              <div className="mt-4 grid gap-4">
                {(() => {
                  const selected = sessions.find((session) => session.id === activeSessionId);
                  return selected ? (
                    <>
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-success text-sm font-black text-white">
                        {(selected.username || "RC").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-text-main dark:text-white">{selected.username || "Customer"}</h3>
                        <p className="text-sm font-semibold text-text-muted">{selected.user_role}</p>
                      </div>
                      <div className="rounded-2xl bg-bg p-4 dark:bg-white/5">
                        <p className="type-label">Linked ticket</p>
                        <p className="mt-1 text-sm font-bold text-text-main dark:text-white">{selected.ticket_id || "Ticket pending"}</p>
                      </div>
                      <Button variant="secondary" onClick={() => acceptChat(selected.id)} disabled={selected.status !== "WAITING"}>Accept / own chat</Button>
                    </>
                  ) : null;
                })()}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-text-muted">Select a chat to see profile, ticket, and assignment details.</p>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}


