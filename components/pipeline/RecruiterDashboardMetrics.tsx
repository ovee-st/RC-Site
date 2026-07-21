"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckSquare2, Gauge, Send } from "lucide-react";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import type { RecruiterDashboardDto } from "@/types/ats";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

export default function RecruiterDashboardMetrics() {
  const [data, setData] = useState<RecruiterDashboardDto | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    compactAuthHeaders("ats_dashboard").then((headers) => fetch("/api/dashboard/recruiter", { headers })).then(async (response) => {
      if (!response.ok) throw new Error("metrics");
      const payload = await response.json(); if (active) setData(payload);
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  if (failed) return null;
  if (!data) return <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}</div>;
  const cards = [
    { label: "Applications today", value: data.applicationsToday, icon: Gauge },
    { label: "Open interviews", value: data.openInterviews, icon: CalendarClock },
    { label: "Pending tasks", value: data.pendingTasks, icon: CheckSquare2 },
    { label: "Active offers", value: data.activeOffers, icon: Send }
  ];
  return (
    <div className="mb-5 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label} className="flex items-center justify-between p-4"><div><p className="text-[11px] font-black uppercase text-text-muted">{label}</p><strong className="mt-1 block text-2xl text-text-main dark:text-white">{value}</strong></div><span className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span></Card>)}</div>
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Card className="p-4"><div className="flex items-center justify-between"><h3 className="text-sm font-black text-text-main dark:text-white">Pipeline conversion</h3><span className="text-xs font-bold text-text-muted">Live funnel</span></div><div className="mt-4 flex min-h-20 items-end gap-2 overflow-x-auto pb-1">{data.pipelineFunnel.map((item) => <div key={item.stageId} className="min-w-16 flex-1"><div className="mx-auto w-full rounded-t bg-primary/70" style={{ height: `${Math.max(5, item.conversion * .65)}px` }} /><p className="mt-2 truncate text-center text-[9px] font-bold text-text-muted" title={item.stage}>{item.stage}</p><p className="text-center text-[10px] font-black text-text-main dark:text-white">{item.count}</p></div>)}</div></Card>
        <Card className="grid min-w-56 grid-cols-2 gap-3 p-4"><Metric label="Time to hire" value={data.averageTimeToHireDays === null ? "--" : `${data.averageTimeToHireDays}d`} /><Metric label="AI acceptance" value={data.aiRecommendationAcceptance === null ? "--" : `${data.aiRecommendationAcceptance}%`} /></Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-black uppercase text-text-muted">{label}</p><strong className="mt-2 block text-xl text-primary">{value}</strong></div>; }
