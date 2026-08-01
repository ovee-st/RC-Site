import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export type BrandFlowStep = {
  label: string;
  detail?: string;
  icon: LucideIcon;
};

export default function BrandFlow({ steps, tone = "blue", compact = false }: { steps: BrandFlowStep[]; tone?: "blue" | "emerald" | "violet"; compact?: boolean }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200"
  };

  return (
    <ol className={compact ? "grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-5" : "grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-[repeat(7,minmax(0,1fr))]"}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <li key={step.label} className="flex min-w-0 items-stretch gap-2">
            <div className={`flex min-h-24 min-w-0 flex-1 flex-col rounded-xl border p-3 ${tones[tone]}`}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <strong className="mt-3 break-words text-xs leading-4 text-slate-950 dark:text-white">{step.label}</strong>
              {step.detail ? <span className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{step.detail}</span> : null}
            </div>
            {index < steps.length - 1 ? <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-slate-300 xl:block dark:text-slate-600" aria-hidden="true" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
