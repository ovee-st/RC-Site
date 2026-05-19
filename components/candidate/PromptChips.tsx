import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export const CAREER_PROMPTS = [
  "Improve my professional summary",
  "Suggest missing skills",
  "Rewrite my work experience",
  "Optimize my CV for ATS",
  "Recommend certifications",
  "Increase my profile score"
];

export default function PromptChips({ disabled, onSelect }: { disabled?: boolean; onSelect: (prompt: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CAREER_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1.5 text-[10px] font-black text-text-muted transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
          )}
        >
          <Sparkles className="h-3 w-3 text-primary" />
          {prompt}
        </button>
      ))}
    </div>
  );
}
