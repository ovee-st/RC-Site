"use client";

import { Paperclip, Send, X } from "lucide-react";
import { useRef, useState } from "react";

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
    <div className="flex items-end gap-2">
      <button type="button" onClick={() => fileInputRef.current?.click()} className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#0866ff] dark:text-slate-300 dark:hover:bg-white/10" aria-label="Attach file">
        <Paperclip className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1 rounded-[22px] bg-slate-100 px-3 py-1.5 dark:bg-slate-800">
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
        className="max-h-24 min-h-7 w-full resize-none bg-transparent px-1 py-1 text-sm font-semibold leading-5 text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-60 dark:text-white dark:placeholder:text-slate-400"
      />
        {file ? (
          <div className="mb-1 flex items-center justify-between rounded-xl bg-white px-2 py-1 text-[11px] font-bold text-[#0866ff] shadow-sm dark:bg-slate-900 dark:text-blue-200">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : null}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={submit}
        disabled={(!value.trim() && !file) || disabled || sending}
        className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0866ff] text-white transition hover:bg-[#0758dc] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white dark:disabled:bg-slate-700"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
