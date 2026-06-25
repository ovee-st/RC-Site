"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, CheckCircle2, Sparkles, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const candidateMetrics: Array<{ value: string; label: string; Icon: LucideIcon }> = [
  { value: "8", label: "Applications", Icon: BriefcaseBusiness },
  { value: "3", label: "Interviews", Icon: UsersRound },
  { value: "88%", label: "Profile Strength", Icon: UserRound },
  { value: "12", label: "Job Matches", Icon: Sparkles }
];

const employerMetrics: Array<{ value: string; label: string; Icon: LucideIcon }> = [
  { value: "186", label: "Candidates", Icon: UsersRound },
  { value: "14", label: "Shortlists", Icon: CheckCircle2 },
  { value: "6", label: "Interviews", Icon: UserRound },
  { value: "72%", label: "Hiring Progress", Icon: BriefcaseBusiness }
];

function HubPanel({ title, subtitle, metrics, tone }: { title: string; subtitle: string; metrics: typeof candidateMetrics; tone: "candidate" | "employer" }) {
  const isCandidate = tone === "candidate";
  return (
    <div className={`flex h-full min-w-0 flex-col rounded-2xl border p-3 sm:p-4 ${isCandidate ? "border-blue-200 bg-blue-50/90 dark:border-blue-400/20 dark:bg-blue-950/30" : "border-emerald-200 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-950/30"}`}>
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white sm:h-11 sm:w-11 ${isCandidate ? "bg-blue-600" : "bg-emerald-600"}`}>
          {isCandidate ? <UserRound className="h-4 w-4 sm:h-5 sm:w-5" /> : <BriefcaseBusiness className="h-4 w-4 sm:h-5 sm:w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-black leading-tight text-slate-950 dark:text-white sm:text-lg">{title}</h2>
          <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-500 dark:text-slate-300 sm:text-xs">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid flex-1 grid-cols-2 gap-2">
        {metrics.map(({ value, label, Icon }) => (
          <div key={label} className="min-h-[5.75rem] rounded-xl border border-white/80 bg-white/90 p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/70 sm:min-h-24 sm:p-3">
            <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isCandidate ? "text-blue-600" : "text-emerald-600"}`} />
            <p className="mt-2 text-lg font-black leading-none text-slate-950 dark:text-white sm:text-xl">{value}</p>
            <p className="mt-1 text-[8px] font-black uppercase leading-tight tracking-normal text-slate-500 [overflow-wrap:anywhere] dark:text-slate-400 sm:text-[9px]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto w-full max-w-2xl lg:max-w-none"
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden rounded-3xl border-white/70 bg-white/95 p-4 shadow-[0_30px_100px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-slate-900/95 sm:p-5">
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          <HubPanel title="Candidate Hub" subtitle="Your career in motion" metrics={candidateMetrics} tone="candidate" />

          <motion.div
            className="flex h-full min-h-56 min-w-0 flex-col items-center justify-center rounded-2xl bg-slate-950 px-3 py-8 text-center text-white shadow-[0_24px_70px_rgba(37,99,235,0.22)] ring-1 ring-blue-400/20 sm:px-4"
            animate={reduceMotion ? undefined : { scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-8 w-8 text-blue-300" />
            <Badge className="mt-3 max-w-full whitespace-normal border-white/20 bg-white/10 px-3 text-center text-[9px] leading-tight text-white shadow-none sm:text-[10px]">AI Matching Engine</Badge>
            <p className="mt-2 text-xs font-black leading-5 sm:text-sm">Talent meets opportunity</p>
          </motion.div>

          <HubPanel title="Employer Hub" subtitle="Your hiring pipeline" metrics={employerMetrics} tone="employer" />
        </div>
      </Card>
    </motion.div>
  );
}
