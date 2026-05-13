"use client";

export default function TypingIndicator({ label = "Support is typing" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </span>
    </div>
  );
}
