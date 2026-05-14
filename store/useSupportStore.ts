"use client";

import { create } from "zustand";
import type { SupportTicket, SupportTicketStatus, TicketMessage } from "@/types/support";

type SupportStore = {
  tickets: SupportTicket[];
  messagesByTicket: Record<string, TicketMessage[]>;
  selectedTicketId: string | null;
  setTickets: (tickets: SupportTicket[]) => void;
  upsertTicket: (ticket: SupportTicket) => void;
  setMessages: (ticketId: string, messages: TicketMessage[]) => void;
  addMessage: (message: TicketMessage) => void;
  selectTicket: (ticketId: string | null) => void;
  moveTicket: (ticketId: string, status: SupportTicketStatus) => void;
};

export const useSupportStore = create<SupportStore>((set) => ({
  tickets: [],
  messagesByTicket: {},
  selectedTicketId: null,
  setTickets: (tickets) => set((state) => ({
    tickets,
    selectedTicketId: state.selectedTicketId && tickets.some((ticket) => ticket.id === state.selectedTicketId)
      ? state.selectedTicketId
      : null
  })),
  upsertTicket: (ticket) => set((state) => ({
    tickets: state.tickets.some((item) => item.id === ticket.id)
      ? state.tickets.map((item) => item.id === ticket.id ? ticket : item)
      : [ticket, ...state.tickets]
  })),
  setMessages: (ticketId, messages) => set((state) => ({
    messagesByTicket: { ...state.messagesByTicket, [ticketId]: messages }
  })),
  addMessage: (message) => set((state) => ({
    messagesByTicket: {
      ...state.messagesByTicket,
      [message.ticket_id]: [...(state.messagesByTicket[message.ticket_id] || []), message]
    }
  })),
  selectTicket: (ticketId) => set({ selectedTicketId: ticketId }),
  moveTicket: (ticketId, status) => set((state) => ({
    tickets: state.tickets.map((ticket) => ticket.id === ticketId ? { ...ticket, status } : ticket)
  }))
}));
