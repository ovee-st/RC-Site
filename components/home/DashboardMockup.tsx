"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CircleDashed,
  FileCheck2,
  FileText,
  ListChecks,
  SearchCheck,
  Send,
  Sparkles,
  Target,
  UserCheck,
  UserRound,
  type LucideIcon
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

type Tone = "candidate" | "employer";

type PreviewItem = {
  title: string;
  detail: string;
  Icon: LucideIcon;
  progress?: number;
};

const candidateItems: PreviewItem[] = [
  { title: "Resume strength", detail: "Strong foundation", Icon: FileCheck2, progress: 82 },
  { title: "AI match", detail: "High alignment", Icon: Target, progress: 94 },
  { title: "Applications", detail: "In review", Icon: Send },
  { title: "Interview progress", detail: "Preparation ready", Icon: CalendarCheck2 }
];

const employerItems: PreviewItem[] = [
  { title: "Qualified candidates", detail: "Evidence ranked", Icon: UserCheck },
  { title: "AI shortlist", detail: "Ready to review", Icon: SearchCheck },
  { title: "Interview pipeline", detail: "Final round", Icon: ListChecks, progress: 74 },
  { title: "Offer status", detail: "Draft prepared", Icon: BadgeCheck }
];

const matchingSteps: Array<{ label: string; detail: string; Icon: LucideIcon; emphasized?: boolean }> = [
  { label: "Resume uploaded", detail: "Profile evidence received", Icon: FileText },
  { label: "AI resume analysis", detail: "Skills and experience mapped", Icon: Sparkles },
  { label: "94% match score", detail: "Illustrative confidence", Icon: Target, emphasized: true },
  { label: "Skill gap analysis", detail: "Growth areas explained", Icon: SearchCheck },
  { label: "Interview ready", detail: "Preparation generated", Icon: Check },
  { label: "Employer recommended", detail: "Qualified profile surfaced", Icon: BriefcaseBusiness }
];

const toneStyles = {
  candidate: {
    shell: "border-blue-200/90 bg-blue-50/80 dark:border-blue-400/20 dark:bg-blue-950/25",
    icon: "bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)]",
    accent: "text-blue-700 dark:text-blue-300",
    progress: "bg-blue-600"
  },
  employer: {
    shell: "border-emerald-200/90 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-950/25",
    icon: "bg-emerald-600 text-white shadow-[0_8px_24px_rgba(5,150,105,0.25)]",
    accent: "text-emerald-700 dark:text-emerald-300",
    progress: "bg-emerald-600"
  }
} satisfies Record<Tone, Record<string, string>>;

function PreviewPanel({
  title,
  subtitle,
  eyebrow,
  items,
  tone
}: {
  title: string;
  subtitle: string;
  eyebrow: string;
  items: PreviewItem[];
  tone: Tone;
}) {
  const styles = toneStyles[tone];
  const HeaderIcon = tone === "candidate" ? UserRound : BriefcaseBusiness;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-2xl border p-3.5 shadow-[0_14px_40px_rgba(15,23,42,0.06)] sm:p-4 ${styles.shell}`}
      aria-label={`${title} sample dashboard`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
          <HeaderIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`text-[10px] font-black uppercase leading-4 ${styles.accent}`}>{eyebrow}</p>
          <h2 className="text-base font-black leading-5 text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-0.5 text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-2.5">
        {items.map(({ title: itemTitle, detail, Icon, progress }) => (
          <motion.div
            key={itemTitle}
            className="flex min-h-28 min-w-0 flex-col rounded-xl border border-white/90 bg-white/90 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-slate-900/80"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={`h-4 w-4 shrink-0 ${styles.accent}`} aria-hidden="true" />
            <p className="mt-2 break-words text-xs font-black leading-4 text-slate-900 dark:text-white">{itemTitle}</p>
            <p className="mt-1 break-words text-[10px] font-semibold leading-4 text-slate-500 dark:text-slate-400">{detail}</p>
            {progress !== undefined ? (
              <div className="mt-auto pt-2" aria-label={`${itemTitle}: illustrative ${progress} percent`}>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div
                    className={`h-full rounded-full ${styles.progress}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
                  />
                </div>
              </div>
            ) : (
              <span className={`mt-auto pt-2 text-[9px] font-black uppercase leading-3 ${styles.accent}`}>Sample status</span>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FlowConnector() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-8 w-full items-center justify-center" aria-hidden="true">
      <div className="relative h-full w-px overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950">
        <motion.span
          className="absolute block rounded-full bg-gradient-to-r from-blue-600 via-violet-500 to-emerald-500"
          style={{ inset: 0, height: "45%" }}
          animate={reduceMotion ? undefined : { y: ["-100%", "230%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <ArrowDown className="-ml-px h-3.5 w-3.5 shrink-0 text-violet-500" />
    </div>
  );
}

function AiEngine() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-violet-300/80 bg-slate-950 px-3.5 py-4 text-white shadow-[0_22px_65px_rgba(67,56,202,0.28)] ring-1 ring-violet-400/40 sm:px-4"
      aria-label="Explainable AI matching workflow sample"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-violet-500/20 to-transparent" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-2">
        <Badge className="border-violet-300/25 bg-violet-400/10 text-[9px] text-violet-100 shadow-none">AI Matching Engine</Badge>
        <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-300">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [1, 1.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          Live preview
        </span>
      </div>

      <div className="relative mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-2.5">
        <motion.span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_24px_rgba(139,92,246,0.4)]"
          animate={reduceMotion ? undefined : { boxShadow: ["0 0 14px rgba(139,92,246,.25)", "0 0 28px rgba(139,92,246,.55)", "0 0 14px rgba(139,92,246,.25)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </motion.span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400">Explainable match</p>
          <p className="text-sm font-black">Evidence, not guesswork</p>
        </div>
      </div>

      <ol className="relative mt-3 flex flex-1 flex-col justify-between gap-1" aria-label="AI matching steps">
        {matchingSteps.map(({ label, detail, Icon, emphasized }, index) => (
          <li key={label}>
            <motion.div
              className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 ${
                emphasized
                  ? "border-violet-300/45 bg-gradient-to-r from-blue-500/20 to-violet-500/25 shadow-[0_0_24px_rgba(99,102,241,0.16)]"
                  : "border-white/[0.07] bg-white/[0.035]"
              }`}
              initial={reduceMotion ? false : { opacity: 0.45, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + index * 0.1 }}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${emphasized ? "bg-violet-500 text-white" : "bg-white/[0.08] text-blue-300"}`}>
                <Icon className="h-3 w-3" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`break-words text-[10px] font-black leading-3.5 ${emphasized ? "text-white" : "text-slate-200"}`}>{label}</p>
                <p className="mt-0.5 break-words text-[8px] font-medium leading-3 text-slate-400">{detail}</p>
              </div>
              {index < matchingSteps.length - 1 ? <CircleDashed className="h-3 w-3 shrink-0 text-violet-300/70" aria-hidden="true" /> : null}
            </motion.div>
            {index < matchingSteps.length - 1 ? (
              <div className="ml-[1.35rem] h-1.5 w-px bg-gradient-to-b from-blue-400/70 to-violet-400/30" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="relative mt-3 text-center text-[8px] font-bold uppercase text-slate-500">Illustrative product workflow</p>
    </section>
  );
}

export default function DashboardMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mx-auto w-full max-w-5xl"
      initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <Card className="overflow-hidden rounded-3xl border-white/75 bg-white/95 p-3 shadow-[0_30px_100px_rgba(37,99,235,0.18)] dark:border-white/10 dark:bg-slate-900/95 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black text-slate-900 dark:text-white">MXVL connected hiring workspace</p>
              <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">Candidate insight to recruiter action</p>
            </div>
          </div>
          <Badge className="shrink-0 border-slate-200 bg-slate-50 text-[8px] text-slate-600 shadow-none dark:border-white/10 dark:bg-white/5 dark:text-slate-300">Demo workspace</Badge>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(13rem,0.9fr)_minmax(0,1fr)] md:gap-2 lg:grid-cols-[minmax(13rem,1fr)_minmax(13rem,0.9fr)_minmax(13rem,1fr)] lg:gap-3">
          <PreviewPanel
            title="Candidate Hub"
            subtitle="Build confidence before applying"
            eyebrow="Sample candidate"
            items={candidateItems}
            tone="candidate"
          />
          <div className="flex min-w-0 flex-col">
            <div className="hidden h-full min-w-0 md:block">
              <AiEngine />
            </div>
            <div className="flex flex-col md:hidden">
              <FlowConnector />
              <AiEngine />
              <FlowConnector />
            </div>
          </div>
          <PreviewPanel
            title="Employer Hub"
            subtitle="Move qualified talent forward"
            eyebrow="Sample employer"
            items={employerItems}
            tone="employer"
          />
        </div>
      </Card>
    </motion.div>
  );
}
