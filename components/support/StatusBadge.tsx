import { cn } from "@/lib/cn";
import Badge from "@/components/ui/Badge";
import { getTicketTone, formatTicketStatus } from "@/lib/support";

export default function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge variant={getTicketTone(status) as any} className={cn("uppercase", className)}>{formatTicketStatus(status)}</Badge>;
}
