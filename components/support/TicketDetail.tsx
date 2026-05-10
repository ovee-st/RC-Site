import type { SupportTicket } from "@/types/support";
import Card from "@/components/ui/Card";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

export default function TicketDetail({ ticket }: { ticket: SupportTicket | null }) {
  if (!ticket) return <Card className="rounded-3xl p-8 text-center text-sm font-bold text-text-muted">Select a ticket to view details.</Card>;
  return <Card className="rounded-3xl p-5"><div className="flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">{ticket.subject}</h2><p className="mt-2 text-sm font-semibold text-text-muted">{ticket.message}</p></Card>;
}
