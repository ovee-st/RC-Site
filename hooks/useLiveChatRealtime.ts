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

    let sessionChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      sessionChannel = supabase
        .channel(`live-chat-sessions-${channelKey}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_sessions", ...(sessionFilter ? { filter: sessionFilter } : {}) }, (payload) => {
          if (payload.new) onSessionChange(payload.new as LiveChatSession);
        })
        .subscribe((status, error) => {
          if (error) {
            console.error("[LiveChatRealtime] Session subscription error", { status, error });
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[LiveChatRealtime] Session subscription degraded", { status });
          }
        });
    } catch (error) {
      console.error("[LiveChatRealtime] Could not start session subscription", error);
    }

    return () => {
      if (sessionChannel) supabase.removeChannel(sessionChannel);
    };
  }, [channelKey, onSessionChange, sessionFilter]);

  useEffect(() => {
    if (!isSupabaseConfigured || !messageSessionId) return;

    let messageChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      messageChannel = supabase
        .channel(`live-chat-messages-${channelKey}-${messageSessionId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `session_id=eq.${messageSessionId}` }, (payload) => {
          if (payload.new) onMessageCreate(payload.new as LiveChatMessage);
        })
        .subscribe((status, error) => {
          if (error) {
            console.error("[LiveChatRealtime] Message subscription error", { status, error, messageSessionId });
          }
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[LiveChatRealtime] Message subscription degraded", { status, messageSessionId });
          }
        });
    } catch (error) {
      console.error("[LiveChatRealtime] Could not start message subscription", error);
    }

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, [channelKey, messageSessionId, onMessageCreate]);
}
