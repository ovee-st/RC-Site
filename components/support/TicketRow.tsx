"use client";

import type { SupportTicket } from "@/types/support";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

export default function TicketRow({ ticket, onSelect }: { ticket: SupportTicket; onSelect?: (ticket: SupportTicket) => void }) {
  return (
    <button type="button" onClick={() => onSelect?.(ticket)} className="w-full rounded-2xl border border-border bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-primary">{ticket.ticket_number}</p>
          <h3 className="mt-1 truncate text-sm font-black text-text-main dark:text-white">{ticket.subject}</h3>
          <p className="mt-1 truncate text-xs font-semibold text-text-muted">{ticket.username} - {ticket.user_role} - {ticket.category || "Other"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
    </button>
  );
}
