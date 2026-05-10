"use client";

import { create } from "zustand";
import type { SupportTicket, TicketMessage } from "@/types/support";

type EmployeeSupportStore = {
  assignedTickets: SupportTicket[];
  openTickets: SupportTicket[];
  escalations: SupportTicket[];
  messagesByTicket: Record<string, TicketMessage[]>;
  setAssignedTickets: (tickets: SupportTicket[]) => void;
  setOpenTickets: (tickets: SupportTicket[]) => void;
  setEscalations: (tickets: SupportTicket[]) => void;
  upsertTicket: (ticket: SupportTicket) => void;
  addMessage: (message: TicketMessage) => void;
};

export const useEmployeeSupportStore = create<EmployeeSupportStore>((set) => ({
  assignedTickets: [],
  openTickets: [],
  escalations: [],
  messagesByTicket: {},
  setAssignedTickets: (assignedTickets) => set({ assignedTickets }),
  setOpenTickets: (openTickets) => set({ openTickets }),
  setEscalations: (escalations) => set({ escalations }),
  upsertTicket: (ticket) => set((state) => {
    const upsert = (items: SupportTicket[]) => items.some((item) => item.id === ticket.id) ? items.map((item) => item.id === ticket.id ? ticket : item) : [ticket, ...items];
    return {
      assignedTickets: ticket.assigned_employee_id ? upsert(state.assignedTickets) : state.assignedTickets.filter((item) => item.id !== ticket.id),
      openTickets: ticket.status === "OPEN" ? upsert(state.openTickets) : state.openTickets.filter((item) => item.id !== ticket.id),
      escalations: ticket.status === "ESCALATED" ? upsert(state.escalations) : state.escalations.filter((item) => item.id !== ticket.id)
    };
  }),
  addMessage: (message) => set((state) => ({
    messagesByTicket: {
      ...state.messagesByTicket,
      [message.ticket_id]: [...(state.messagesByTicket[message.ticket_id] || []), message]
    }
  }))
}));
