"use client";

import type { SupportTicket } from "@/types/support";
import TicketRow from "./TicketRow";

export default function TicketList({ tickets, onSelect }: { tickets: SupportTicket[]; onSelect?: (ticket: SupportTicket) => void }) {
  return <div className="grid gap-3">{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onSelect={onSelect} />)}</div>;
}
