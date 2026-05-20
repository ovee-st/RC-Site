import Badge from "@/components/ui/Badge";
import type { ProfileAnalysis } from "@/lib/ai/profile-analysis";

export default function ProfileInsightBadges({ analysis, promptsUsed, promptLimit }: { analysis: ProfileAnalysis; promptsUsed: number; promptLimit: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-2.5 dark:border-blue-400/20 dark:bg-blue-400/10">
        <p className="text-[10px] font-black uppercase tracking-wide text-text-muted dark:text-slate-300">Profile score</p>
        <p className="mt-0.5 text-lg font-black text-text-main dark:text-white">{analysis.profileCompletionScore}%</p>
      </div>
      <div className="rounded-xl border border-success/15 bg-success/5 p-2.5 dark:bg-success/10">
        <p className="text-[10px] font-black uppercase tracking-wide text-text-muted dark:text-slate-300">ATS score</p>
        <p className="mt-0.5 text-lg font-black text-text-main dark:text-white">{analysis.atsScore}%</p>
      </div>
      <div className="rounded-xl border border-border bg-bg p-2.5 dark:border-white/10 dark:bg-white/5">
        <p className="text-[10px] font-black uppercase tracking-wide text-text-muted dark:text-slate-300">AI prompts</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="text-xl font-black text-text-main dark:text-white">{promptsUsed}/{promptLimit}</p>
          <Badge variant={promptsUsed >= promptLimit ? "neutral" : "primary"}>{promptsUsed >= promptLimit ? "Limit" : "Ready"}</Badge>
        </div>
        <p className="mt-1 text-[10px] font-bold text-text-muted dark:text-slate-400">Resets monthly</p>
      </div>
    </div>
  );
}
