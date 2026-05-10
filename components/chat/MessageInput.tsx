"use client";

import { Paperclip, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function MessageInput({ disabled, placeholder = "Write a message...", onSend }: { disabled?: boolean; placeholder?: string; onSend: (message: string, file?: File | null) => Promise<void> | void }) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function submit() {
    const text = value.trim();
    if ((!text && !file) || sending || disabled) return;
    setSending(true);
    await onSend(text || "Attachment shared", file);
    setValue("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSending(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-2 shadow-soft dark:border-white/10 dark:bg-slate-950">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-16 w-full resize-none bg-transparent px-2 py-2 text-sm font-semibold outline-none disabled:opacity-60"
      />
      {file ? (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-primary/8 px-3 py-2 text-xs font-bold text-primary">
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment"><X className="h-3.5 w-3.5" /></button>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full p-2 text-text-muted transition hover:bg-primary/10 hover:text-primary" aria-label="Attach file">
          <Paperclip className="h-4 w-4" />
        </button>
        <Button type="button" onClick={submit} disabled={(!value.trim() && !file) || disabled || sending} className="gap-2 px-4 py-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </div>
  );
}
