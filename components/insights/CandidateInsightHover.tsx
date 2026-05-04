import { ReactNode } from "react";
import { Brain, CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type CandidateInsightHoverProps = {
  children: ReactNode;
  strengths: string[];
  missingSkills: string[];
  recommendation: string;
  className?: string;
};

export default function CandidateInsightHover({
  children,
  strengths,
  missingSkills,
  recommendation,
  className
}: CandidateInsightHoverProps) {
  return (
    <div className={cn("group/insight relative", className)}>
      {children}
      <div className="pointer-events-none absolute bottom-[calc(100%+0.75rem)] left-4 z-50 w-[min(320px,calc(100vw-3rem))] translate-y-2 opacity-0 transition duration-200 group-hover/insight:translate-y-0 group-hover/insight:opacity-100 group-focus-within/insight:translate-y-0 group-focus-within/insight:opacity-100 lg:left-6">
        <div className="rounded-2xl border border-border bg-surface/95 p-3 text-left shadow-hover backdrop-blur dark:border-white/10 dark:bg-surface-dark/95">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Badge variant="primary" className="gap-1.5">
              <Brain size={13} />
              AI insight
            </Badge>
            <span className="text-[11px] font-bold text-text-muted">Hover analysis</span>
          </div>

          <div className="grid gap-2.5">
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-success">
                <CheckCircle2 size={14} />
                Strengths
              </div>
              <div className="flex flex-wrap gap-1.5">
                {strengths.length ? strengths.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="success" className="px-2 py-1 text-[11px]">{skill}</Badge>
                )) : <span className="text-xs font-medium text-text-muted">No obvious strengths detected yet</span>}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-300">
                <TriangleAlert size={14} />
                Missing skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.length ? missingSkills.slice(0, 4).map((skill) => (
                  <Badge key={skill} className="px-2 py-1 text-[11px]">{skill}</Badge>
                )) : <Badge variant="success" className="px-2 py-1 text-[11px]">No major gaps</Badge>}
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-2.5 dark:border-primary/20 dark:bg-primary/10">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold text-primary dark:text-blue-300">
                <Sparkles size={14} />
                Recommendation
              </div>
              <p className="text-xs font-semibold leading-5 text-text-main dark:text-white">{recommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
