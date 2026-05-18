"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BriefcaseBusiness, CheckCircle2, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

const cockpitMetrics: Array<{ value: string; label: string; Icon: LucideIcon }> = [
  { value: "12", label: "interviews", Icon: UsersRound },
  { value: "3", label: "offers", Icon: CheckCircle2 },
  { value: "94%", label: "match score", Icon: Sparkles },
  { value: "8", label: "applications", Icon: BriefcaseBusiness }
];
const candidates = [
  { name: "Md Jahid Anwar", role: "Admin & Operations", score: 94, skills: ["Admin", "Excel", "Coordination"], initials: "MJ" },
  { name: "Nusrat Jahan", role: "Customer Support", score: 88, skills: ["CRM", "Communication"], initials: "NJ" },
  { name: "Rakib Ahmed", role: "Business Promoter", score: 92, skills: ["Sales", "Field Ops"], initials: "RA" }
];

export default function DashboardMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="relative mx-auto max-w-xl lg:max-w-none"
      initial={reduceMotion ? false : { opacity: 0, y: 32, scale: 0.96 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-blue-500/25 via-red-500/10 to-emerald-400/20 blur-3xl" />
      <Card className="relative overflow-hidden rounded-[2rem] border-white/70 bg-white/90 p-3 shadow-[0_30px_100px_rgba(37,99,235,0.18)] backdrop-blur dark:border-white/10 dark:bg-slate-900/90 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[0.78fr_1fr]">
          <motion.div
            className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-600 p-5 text-white"
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute -right-12 top-8 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="absolute -left-16 bottom-6 h-32 w-32 rounded-full bg-red-400/20 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <Badge className="border-white/25 bg-white/10 text-white shadow-none">Live cockpit</Badge>
              <motion.div animate={reduceMotion ? undefined : { rotate: [0, 12, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                <Sparkles className="h-6 w-6 text-blue-100" />
              </motion.div>
            </div>
            <h2 className="relative mt-6 text-2xl font-black tracking-tight">Recruiter command center</h2>
            <p className="relative mt-3 text-sm leading-6 text-white/78">Ranked shortlists, live pipelines, support signals, and hiring progress in one glance.</p>
            <div className="relative mt-6 grid grid-cols-2 gap-3">
              {cockpitMetrics.map(({ value, label, Icon }, index) => (
                <motion.div
                  key={String(label)}
                  className="rounded-2xl border border-white/10 bg-white/12 p-4 backdrop-blur"
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={reduceMotion ? undefined : { opacity: 1, y: [0, -5, 0] }}
                  transition={{ opacity: { delay: index * 0.08 }, y: { duration: 3.4, repeat: Infinity, delay: index * 0.35 } }}
                >
                  <Icon className="mb-3 h-4 w-4 text-blue-100" />
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white/70">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="relative space-y-3 overflow-hidden rounded-[1.5rem] bg-slate-50/70 p-3 dark:bg-white/5 sm:p-4">
            <motion.div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent"
              animate={reduceMotion ? undefined : { x: ["-150%", "580%"] }}
              transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
            />
            {candidates.map((candidate, index) => (
              <motion.div
                key={candidate.name}
                className="relative rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-white/10 dark:bg-slate-950/70"
                initial={reduceMotion ? false : { opacity: 0, x: 28 }}
                animate={reduceMotion ? undefined : { opacity: 1, x: 0, y: [0, -7, 0] }}
                transition={{ opacity: { delay: index * 0.1 }, x: { delay: index * 0.1 }, y: { duration: 4, repeat: Infinity, delay: index * 0.5 } }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-black text-white shadow-lg">
                      {candidate.initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-slate-950 dark:text-white">{candidate.name}</h3>
                      <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-300">{candidate.role}</p>
                    </div>
                  </div>
                  <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }} transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.35 }}>
                    <Badge variant="match-score">{candidate.score}%</Badge>
                  </motion.div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="success" className="text-[11px]">{skill}</Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}



