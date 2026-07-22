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
    <div className={`flex h-full w-full min-w-0 flex-col rounded-2xl border p-4 ring-2 ${isCandidate ? "border-blue-200 bg-blue-50/90 ring-blue-400/80 dark:border-blue-400/20 dark:bg-blue-950/30" : "border-emerald-200 bg-emerald-50/90 ring-emerald-400/80 dark:border-emerald-400/20 dark:bg-emerald-950/30"}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white ${isCandidate ? "bg-blue-600" : "bg-emerald-600"}`}>
          {isCandidate ? <UserRound className="h-5 w-5" /> : <BriefcaseBusiness className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-black leading-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-xs font-semibold leading-4 text-slate-500 dark:text-slate-300">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid flex-1 grid-cols-2 auto-rows-fr gap-3">
        {metrics.map(({ value, label, Icon }) => (
          <div key={label} className="flex min-h-[7.5rem] min-w-0 flex-col justify-between rounded-xl border border-white/80 bg-white/90 px-3 py-3.5 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <Icon className={`mx-auto h-4 w-4 shrink-0 ${isCandidate ? "text-blue-600" : "text-emerald-600"}`} />
            <p className="mt-2 text-xl font-black leading-none text-slate-950 dark:text-white">{value}</p>
            <p className="mt-2 break-words text-[11px] font-black uppercase leading-tight tracking-normal text-slate-500 dark:text-slate-400">{label}</p>
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
      className="mx-auto w-full max-w-2xl lg:max-w-none"
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Card className="rounded-3xl border-white/70 bg-white/95 p-3 shadow-[0_30px_100px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-slate-900/95 md:hidden">
        <div className="grid gap-3" aria-label="AI recruitment dashboard preview">
          <MobileHub title="Candidate Hub" subtitle="Your career in motion" value="88%" label="Profile strength" tone="candidate" />
          <div className="flex min-h-24 items-center gap-4 rounded-2xl border border-violet-300 bg-slate-950 px-4 py-4 text-white ring-2 ring-violet-400/70">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><Sparkles className="h-6 w-6 text-blue-300" /></span>
            <div className="min-w-0"><Badge className="border-white/20 bg-white/10 text-[9px] text-white shadow-none">AI Matching Engine</Badge><p className="mt-2 text-sm font-black">Talent meets opportunity</p></div>
          </div>
          <MobileHub title="Employer Hub" subtitle="Your hiring pipeline" value="72%" label="Hiring progress" tone="employer" />
        </div>
      </Card>
      <Card className="hidden overflow-x-auto rounded-3xl border-white/70 bg-white/95 p-4 shadow-[0_30px_100px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-slate-900/95 sm:p-5 md:block">
        <div className="grid min-w-[42rem] grid-cols-[minmax(14rem,1fr)_minmax(11rem,0.72fr)_minmax(14rem,1fr)] items-stretch justify-center gap-6 lg:min-w-0">
          <div className="min-w-0">
            <HubPanel title="Candidate Hub" subtitle="Your career in motion" metrics={candidateMetrics} tone="candidate" />
          </div>

          <motion.div
            className="flex h-full min-h-56 min-w-0 flex-col items-center justify-center rounded-2xl border border-violet-300 bg-slate-950 px-4 py-8 text-center text-white shadow-[0_24px_70px_rgba(37,99,235,0.22)] ring-2 ring-violet-400/80"
            animate={reduceMotion ? undefined : { scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-8 w-8 text-blue-300" />
            <Badge className="mt-3 max-w-full whitespace-normal border-white/20 bg-white/10 px-3 text-center text-[9px] leading-tight text-white shadow-none sm:text-[10px]">AI Matching Engine</Badge>
            <p className="mt-2 text-xs font-black leading-5 sm:text-sm">Talent meets opportunity</p>
          </motion.div>

          <div className="min-w-0">
            <HubPanel title="Employer Hub" subtitle="Your hiring pipeline" metrics={employerMetrics} tone="employer" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function MobileHub({ title, subtitle, value, label, tone }: { title: string; subtitle: string; value: string; label: string; tone: "candidate" | "employer" }) {
  const candidate = tone === "candidate";
  const Icon = candidate ? UserRound : BriefcaseBusiness;
  return <div className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 ${candidate ? "border-blue-200 bg-blue-50/90 dark:border-blue-400/20 dark:bg-blue-950/30" : "border-emerald-200 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-950/30"}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white ${candidate ? "bg-blue-600" : "bg-emerald-600"}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2><p className="text-xs font-semibold text-slate-500 dark:text-slate-300">{subtitle}</p></div><div className="shrink-0 text-right"><strong className="block text-xl font-black text-slate-950 dark:text-white">{value}</strong><span className="block max-w-20 text-[9px] font-black uppercase leading-tight text-slate-500 dark:text-slate-400">{label}</span></div></div>;
}
