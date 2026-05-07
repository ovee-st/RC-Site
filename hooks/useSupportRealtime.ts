"use client";

import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { SupportTicket, TicketMessage } from "@/types/support";

type UseSupportRealtimeOptions = {
  channelKey: string;
  onTicketChange: (ticket: SupportTicket) => void;
  onMessageCreate: (message: TicketMessage) => void;
};

export function useSupportRealtime({ channelKey, onTicketChange, onMessageCreate }: UseSupportRealtimeOptions) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const ticketChannel = supabase
      .channel(`support-ticket-updates-${channelKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (payload) => {
        if (payload.new) onTicketChange(payload.new as SupportTicket);
      })
      .subscribe();

    const messageChannel = supabase
      .channel(`support-message-updates-${channelKey}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (payload) => {
        if (payload.new) onMessageCreate(payload.new as TicketMessage);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(messageChannel);
    };
  }, [channelKey, onMessageCreate, onTicketChange]);
}
