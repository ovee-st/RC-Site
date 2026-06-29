"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { LiveChatMessage, LiveChatSession } from "@/types/liveChat";

type UseLiveChatRealtimeOptions = {
  channelKey: string;
  messageSessionId?: string | null;
  sessionFilter?: string;
  onSessionChange: (session: LiveChatSession) => void;
  onMessageCreate: (message: LiveChatMessage) => void;
};

export function useLiveChatRealtime({ channelKey, messageSessionId, sessionFilter, onSessionChange, onMessageCreate }: UseLiveChatRealtimeOptions) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const sessionChannel = supabase
      .channel(`live-chat-sessions-${channelKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_sessions", ...(sessionFilter ? { filter: sessionFilter } : {}) }, (payload) => {
        if (payload.new) onSessionChange(payload.new as LiveChatSession);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [channelKey, onSessionChange, sessionFilter]);

  useEffect(() => {
    if (!isSupabaseConfigured || !messageSessionId) return;

    const messageChannel = supabase
      .channel(`live-chat-messages-${channelKey}-${messageSessionId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `session_id=eq.${messageSessionId}` }, (payload) => {
        if (payload.new) onMessageCreate(payload.new as LiveChatMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [channelKey, messageSessionId, onMessageCreate]);
}
