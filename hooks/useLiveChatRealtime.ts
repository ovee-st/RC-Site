"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { LiveChatMessage, LiveChatSession } from "@/types/liveChat";

type UseLiveChatRealtimeOptions = {
  channelKey: string;
  onSessionChange: (session: LiveChatSession) => void;
  onMessageCreate: (message: LiveChatMessage) => void;
};

export function useLiveChatRealtime({ channelKey, onSessionChange, onMessageCreate }: UseLiveChatRealtimeOptions) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const sessionChannel = supabase
      .channel(`live-chat-sessions-${channelKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_chat_sessions" }, (payload) => {
        if (payload.new) onSessionChange(payload.new as LiveChatSession);
      })
      .subscribe();

    const messageChannel = supabase
      .channel(`live-chat-messages-${channelKey}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_chat_messages" }, (payload) => {
        if (payload.new) onMessageCreate(payload.new as LiveChatMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [channelKey, onMessageCreate, onSessionChange]);
}
