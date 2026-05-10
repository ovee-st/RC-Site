import type { TicketMessage } from "@/types/support";

export default function MessageThread({ messages }: { messages: TicketMessage[] }) {
  return <div className="grid gap-3">{messages.map((message) => <div key={message.id} className="rounded-2xl border border-border bg-bg p-4 text-sm font-semibold text-text-muted dark:border-white/10 dark:bg-white/5">{message.message}</div>)}</div>;
}
