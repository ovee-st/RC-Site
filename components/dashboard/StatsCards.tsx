"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, CalendarCheck, FileBadge, Sparkles } from "lucide-react";
import type { CandidateProfile } from "@/types/candidate";
import type { CandidateApplication } from "@/types/application";
import Card from "@/components/ui/Card";

export default function StatsCards({ profile, applications }: { profile: CandidateProfile; applications: CandidateApplication[] }) {
  const stats = [
    { label: "Profile completion", value: `${profile.profileCompletion}%`, icon: FileBadge, bar: profile.profileCompletion, tone: "from-blue-500 to-cyan-400" },
    { label: "Active applications", value: applications.filter((app) => app.status !== "Rejected").length.toString(), icon: BriefcaseBusiness, bar: 72, tone: "from-emerald-500 to-teal-400" },
    { label: "Upcoming interviews", value: applications.filter((app) => app.status === "Interview").length.toString(), icon: CalendarCheck, bar: 48, tone: "from-amber-500 to-orange-400" },
    { label: "AI match score", value: `${profile.aiMatchScore}%`, icon: Sparkles, bar: profile.aiMatchScore, tone: "from-violet-500 to-blue-500" }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
            <Card className="group min-h-[150px] overflow-hidden p-4">
              <div className="flex items-start justify-between gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-soft`}>
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-text-muted transition group-hover:text-primary" />
              </div>
              <p className="mt-4 text-xs font-bold text-text-muted dark:text-slate-300">{stat.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-text-main dark:text-white">{stat.value}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border dark:bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stat.bar}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className={`h-full rounded-full bg-gradient-to-r ${stat.tone}`} />
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
