import type { SupportTicket } from "@/types/support";
import Card from "@/components/ui/Card";

export default function TicketStats({ tickets }: { tickets: SupportTicket[] }) {
  const open = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const assigned = tickets.filter((ticket) => ticket.assigned_employee_id).length;
  const resolved = tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length;
  return <div className="grid gap-3 sm:grid-cols-3">{[["Open", open], ["Assigned", assigned], ["Resolved", resolved]].map(([label, value]) => <Card key={label} className="rounded-2xl p-4"><p className="text-2xl font-black text-text-main dark:text-white">{value}</p><p className="text-xs font-bold text-text-muted">{label}</p></Card>)}</div>;
}
