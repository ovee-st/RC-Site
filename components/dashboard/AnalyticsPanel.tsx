"use client";

import { Activity, Eye, LineChart, Percent } from "lucide-react";
import type { CandidateAnalytics } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function AnalyticsPanel({ analytics }: { analytics: CandidateAnalytics }) {
  const metrics = [
    { label: "Success rate", value: `${analytics.applicationSuccessRate}%`, icon: Percent },
    { label: "Interviews", value: analytics.interviewsCompleted.toString(), icon: Activity },
    { label: "Response rate", value: `${analytics.recruiterResponseRate}%`, icon: LineChart },
    { label: "Profile views", value: analytics.profileViews.toString(), icon: Eye }
  ];
  return (
    <Card className="p-6">
      <Badge variant="primary">Analytics</Badge><h2 className="mt-2 text-2xl font-black dark:text-white">Career performance</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="rounded-2xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-black dark:text-white">{metric.value}</p><p className="text-sm font-semibold text-text-muted dark:text-slate-300">{metric.label}</p></div>; })}</div>
      <div className="mt-6 rounded-3xl border border-border bg-bg p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-black dark:text-white">Skill trends</h3><div className="mt-4 space-y-3">{analytics.skillTrends.map((trend) => <div key={trend.skill}><div className="flex justify-between text-sm font-bold"><span>{trend.skill}</span><span>{trend.value}%</span></div><div className="mt-2 h-2 rounded-full bg-border dark:bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${trend.value}%` }} /></div></div>)}</div></div>
    </Card>
  );
}
