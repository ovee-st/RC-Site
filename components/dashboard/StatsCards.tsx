"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, CalendarCheck, FileBadge } from "lucide-react";
import type { CandidateProfile } from "@/types/candidate";
import type { CandidateApplication } from "@/types/application";
import Card from "@/components/ui/Card";

type StatsCardsProps = {
  profile: CandidateProfile;
  applications: CandidateApplication[];
  upcomingInterviews?: number;
};

export default function StatsCards({ profile, applications, upcomingInterviews = 0 }: StatsCardsProps) {
  const activeApplications = applications.filter((app) => !["Rejected", "Closed"].includes(app.status)).length;
  const interviewCount = upcomingInterviews || applications.filter((app) => app.status === "Interview").length;
  const activeApplicationsBar = applications.length ? Math.round((activeApplications / applications.length) * 100) : 0;
  const interviewBar = Math.min(Math.max(interviewCount * 35, interviewCount > 0 ? 35 : 0), 100);

  const stats = [
    {
      label: "Profile completion",
      value: `${profile.profileCompletion}%`,
      icon: FileBadge,
      bar: profile.profileCompletion,
      tone: "from-blue-500 to-cyan-400",
      targetLabel: "Open profile",
      href: "/candidate?view=profile"
    },
    {
      label: "Active applications",
      value: activeApplications.toString(),
      icon: BriefcaseBusiness,
      bar: activeApplicationsBar,
      tone: "from-emerald-500 to-teal-400",
      targetLabel: "View applications",
      targetId: "candidate-applications-section"
    },
    {
      label: "Upcoming interviews",
      value: interviewCount.toString(),
      icon: CalendarCheck,
      bar: interviewBar,
      tone: "from-amber-500 to-orange-400",
      targetLabel: "View interviews",
      targetId: "candidate-interviews-section"
    }
  ];

  const openTarget = (stat: (typeof stats)[number]) => {
    if (stat.href) {
      window.location.href = stat.href;
      return;
    }

    if (stat.targetId) {
      document.getElementById(stat.targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
            <Card className="group min-h-[145px] overflow-hidden p-0">
              <button
                type="button"
                onClick={() => openTarget(stat)}
                className="block h-full w-full p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={stat.targetLabel}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${stat.tone} text-white shadow-soft`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-4 text-xs font-bold text-text-muted dark:text-slate-300">{stat.label}</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-text-main dark:text-white">{stat.value}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border dark:bg-white/10">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stat.bar}%` }} transition={{ duration: 0.7, ease: "easeOut" }} className={`h-full rounded-full bg-gradient-to-r ${stat.tone}`} />
                </div>
              </button>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
