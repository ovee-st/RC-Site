"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MessageComposer({ value, onChange, onSend, disabled }: { value: string; onChange: (value: string) => void; onSend: () => void; disabled?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-3 dark:border-white/10 dark:bg-slate-900">
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Write a reply..." className="min-h-24 w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold outline-none" />
      <div className="flex justify-end"><Button onClick={onSend} disabled={disabled || !value.trim()} className="gap-2"><Send className="h-4 w-4" />Send reply</Button></div>
    </div>
  );
}
