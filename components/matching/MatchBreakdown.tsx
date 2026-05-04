"use client";

import { Info } from "lucide-react";
import type { MatchResult } from "@/types";
import { cn } from "@/lib/cn";

const rows = [
  { key: "skills", label: "Skills match", max: 40 },
  { key: "experience", label: "Experience match", max: 30 },
  { key: "semantic", label: "Semantic similarity", max: 20 },
  { key: "industry", label: "Industry match", max: 10 }
] as const;

function toneClass(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.75) return "bg-success";
  if (ratio >= 0.45) return "bg-yellow-400";
  return "bg-red-500";
}

function textToneClass(value: number, max: number) {
  const ratio = max ? value / max : 0;
  if (ratio >= 0.75) return "text-success";
  if (ratio >= 0.45) return "text-yellow-600 dark:text-yellow-300";
  return "text-red-500";
}

export default function MatchBreakdown({ match, compact = false }: { match: MatchResult; compact?: boolean }) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-surface p-4 shadow-soft dark:border-white/10 dark:bg-white/5", compact && "p-2.5")}
      title="Match score calculated using AI semantic + structured analysis"
    >
      <div className={cn("mb-4 flex items-center justify-between gap-3", compact && "mb-2")}>
        <div>
          <p className="type-label">AI score breakdown</p>
          {!compact ? <p className="type-body mt-1 text-xs">Structured fit plus semantic profile analysis.</p> : null}
        </div>
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary", compact && "h-6 w-6")}>
          <Info size={compact ? 12 : 15} />
        </span>
      </div>

      <div className={cn("grid gap-3", compact && "gap-1.5")}>
        {rows.map((row) => {
          const value = match.breakdown[row.key];
          const width = Math.min(100, Math.round((value / row.max) * 100));

          return (
            <div key={row.key}>
              <div className={cn("mb-1.5 flex items-center justify-between gap-3", compact && "mb-1")}>
                <span className="text-xs font-semibold text-text-muted">{row.label}</span>
                <span className={cn("text-xs font-bold", textToneClass(value, row.max))}>{value}%</span>
              </div>
              <div className={cn("h-2 overflow-hidden rounded-full bg-border/70 dark:bg-white/10", compact && "h-1.5")}>
                <div
                  className={cn("h-full rounded-full transition-all duration-500", toneClass(value, row.max))}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
