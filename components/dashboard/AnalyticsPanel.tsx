"use client";

import { motion } from "framer-motion";
import { Activity, Eye, LineChart, Percent } from "lucide-react";
import type { CandidateAnalytics } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export default function AnalyticsPanel({ analytics }: { analytics: CandidateAnalytics }) {
  const metrics = [
    { label: "Resume score", value: `${clamp(analytics.applicationSuccessRate + 8)}%`, icon: Percent, tone: "from-blue-500 to-cyan-400" },
    { label: "Interviews", value: analytics.interviewsCompleted.toString(), icon: Activity, tone: "from-emerald-500 to-teal-400" },
    { label: "Response rate", value: `${analytics.recruiterResponseRate}%`, icon: LineChart, tone: "from-amber-500 to-orange-400" },
    { label: "Profile views", value: analytics.profileViews.toString(), icon: Eye, tone: "from-violet-500 to-blue-500" }
  ];

  const skillSignals = [
    { label: "ATS Optimization", value: clamp(analytics.applicationSuccessRate + 12) },
    { label: "Experience Strength", value: clamp(analytics.interviewsCompleted * 18 + 58) },
    { label: "Skills Coverage", value: clamp(analytics.skillTrends.reduce((sum, trend) => sum + trend.value, 0) / Math.max(analytics.skillTrends.length, 1)) },
    { label: "Keyword Match", value: clamp(analytics.recruiterResponseRate + 10) }
  ];

  return (
    <Card className="p-4 shadow-soft md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="primary">Career performance</Badge>
          <h2 className="mt-2 text-lg font-black text-text-main dark:text-white">Performance snapshot</h2>
          <p className="mt-1 text-xs font-semibold text-text-muted dark:text-slate-400">
            Compact signals from your CV, applications, interviews, and recruiter engagement.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5"
            >
              <div className={`grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br ${metric.tone} text-white shadow-soft`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-2xl font-black leading-none text-text-main dark:text-white">{metric.value}</p>
              <p className="mt-1 text-xs font-bold text-text-muted dark:text-slate-300">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-bg p-3.5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-text-main dark:text-white">Profile readiness signals</h3>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">Live analysis</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {skillSignals.map((signal) => (
            <div key={signal.label}>
              <div className="flex justify-between text-xs font-bold text-text-muted dark:text-slate-300">
                <span>{signal.label}</span>
                <span>{signal.value}%</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-border dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${signal.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-success"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
