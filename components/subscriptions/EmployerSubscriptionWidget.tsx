"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, BriefcaseBusiness, CalendarClock, Eye, Sparkles, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import {
  DEMO_EMPLOYER_USAGE,
  EMPLOYER_PLANS,
  getLimitLabel,
  getUsagePercent,
  type EmployerPlanId,
  type UsageLimit
} from "@/lib/subscriptions";
import { cn } from "@/lib/cn";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

type UsageMetric = {
  label: string;
  used: number;
  limit: UsageLimit;
  icon: typeof BriefcaseBusiness;
  tone: "blue" | "emerald" | "cyan" | "violet";
};

export type EmployerSubscriptionWidgetData = {
  currentPlanId: EmployerPlanId;
  renewalDate: string;
  jobsUsed: number;
  jobsLimit: UsageLimit;
  candidateViewsUsed: number;
  candidateViewsLimit: UsageLimit;
  aiCreditsUsed: number;
  aiCreditsLimit: UsageLimit;
  recruiterSeatsUsed: number;
  recruiterSeatsLimit: UsageLimit;
};

const EMPTY_EMPLOYER_USAGE: EmployerSubscriptionWidgetData = {
  currentPlanId: "starter",
  renewalDate: "Not set",
  jobsUsed: 0,
  jobsLimit: 0,
  candidateViewsUsed: 0,
  candidateViewsLimit: 0,
  aiCreditsUsed: 0,
  aiCreditsLimit: 0,
  recruiterSeatsUsed: 0,
  recruiterSeatsLimit: 0
};

const toneStyles: Record<UsageMetric["tone"], { icon: string; bar: string; bg: string }> = {
  blue: {
    icon: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    bar: "from-blue-600 to-cyan-500",
    bg: "bg-blue-50/70 dark:bg-blue-500/10"
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    bar: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50/70 dark:bg-emerald-500/10"
  },
  cyan: {
    icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
    bar: "from-cyan-500 to-blue-500",
    bg: "bg-cyan-50/70 dark:bg-cyan-500/10"
  },
  violet: {
    icon: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    bar: "from-violet-500 to-fuchsia-500",
    bg: "bg-violet-50/70 dark:bg-violet-500/10"
  }
};

function UsageMeter({ metric }: { metric: UsageMetric }) {
  const Icon = metric.icon;
  const percent = getUsagePercent(metric.used, metric.limit);
  const limitLabel = getLimitLabel(metric.limit);
  const tone = toneStyles[metric.tone];

  return (
    <div className={cn("rounded-md border border-border/80 p-4 shadow-soft dark:border-white/10", tone.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", tone.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-text-main dark:text-white">{metric.label}</p>
            <p className="mt-1 text-xs font-bold text-text-muted dark:text-slate-300">
              {metric.used} / {limitLabel}
            </p>
          </div>
        </div>
        <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
          {metric.limit === "unlimited" ? "Open" : `${percent}%`}
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-900">
        <div className={cn("h-full rounded-full bg-gradient-to-r", tone.bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function EmployerSubscriptionWidget({ data = DEMO_EMPLOYER_USAGE }: { data?: EmployerSubscriptionWidgetData }) {
  const [liveData, setLiveData] = useState<EmployerSubscriptionWidgetData | null>(null);
  const [liveStatus, setLiveStatus] = useState<"loading" | "loaded" | "empty" | "fallback">(
    isSupabaseConfigured ? "loading" : "fallback"
  );
  const [requests, setRequests] = useState<Record<string, any>[]>([]);
  const displayData = liveData || (isSupabaseConfigured ? EMPTY_EMPLOYER_USAGE : data);
  const currentPlan = EMPLOYER_PLANS.find((plan) => plan.id === displayData.currentPlanId) ?? EMPLOYER_PLANS[0];
  const currentPlanName = liveStatus === "loading"
    ? "Loading plan..."
    : liveStatus === "empty"
      ? "No active plan"
      : currentPlan.name;
  const latestRequest = useMemo(() => requests[0] || null, [requests]);
  const pendingRequest = useMemo(() => requests.find((request) => ["pending", "more_info"].includes(String(request.status || ""))) || null, [requests]);
  const usageMetrics: UsageMetric[] = [
    {
      label: "Jobs Used",
      used: displayData.jobsUsed,
      limit: displayData.jobsLimit,
      icon: BriefcaseBusiness,
      tone: "blue"
    },
    {
      label: "Candidate Views Used",
      used: displayData.candidateViewsUsed,
      limit: displayData.candidateViewsLimit,
      icon: Eye,
      tone: "emerald"
    },
    {
      label: "AI Credits Used",
      used: displayData.aiCreditsUsed,
      limit: displayData.aiCreditsLimit,
      icon: Bot,
      tone: "cyan"
    },
    {
      label: "Recruiter Seats Used",
      used: displayData.recruiterSeatsUsed,
      limit: displayData.recruiterSeatsLimit,
      icon: Users,
      tone: "violet"
    }
  ];

  useEffect(() => {
    async function loadSubscriptionData() {
      if (!isSupabaseConfigured) return;
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData.session?.access_token || "";
      if (!token) {
        const refreshed = await supabase.auth.refreshSession().catch(() => null);
        token = refreshed?.data?.session?.access_token || "";
      }
      if (!token) return;

      const [subscriptionResponse, paymentsResponse] = await Promise.all([
        fetch("/api/employer/subscription", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        }).catch(() => null),
        fetch("/api/subscription-payments", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        }).catch(() => null)
      ]);

      if (subscriptionResponse?.ok) {
        const payload = await subscriptionResponse.json().catch(() => ({}));
        if (payload.widget?.currentPlanId) {
          setLiveData(payload.widget as EmployerSubscriptionWidgetData);
          setLiveStatus("loaded");
        } else {
          setLiveData(null);
          setLiveStatus("empty");
        }
      } else {
        setLiveStatus("empty");
      }

      if (paymentsResponse?.ok) {
        const payload = await paymentsResponse.json().catch(() => ({}));
        if (Array.isArray(payload.requests)) setRequests(payload.requests);
      }
    }
    loadSubscriptionData();
  }, []);

  return (
    <Card className="depth-primary overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="border-b border-border bg-slate-50 p-6 dark:border-white/10 dark:bg-white/5 lg:border-b-0 lg:border-r">
          <Badge variant="primary" className="type-label text-primary">Subscription</Badge>
          <h2 className="type-h2 mt-3">Employer subscription</h2>

          <div className="mt-6 space-y-4">
            <div className="rounded-md border border-border bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-text-muted">Current Plan</p>
                  <p className="mt-1 text-lg font-black text-text-main dark:text-white">{currentPlanName}</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-text-muted">Renewal Date</p>
                  <p className="mt-1 text-lg font-black text-text-main dark:text-white">{displayData.renewalDate}</p>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border bg-white p-4 shadow-soft dark:border-white/10 dark:bg-slate-950">
              <p className="text-xs font-black uppercase text-text-muted">Subscription Status</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={pendingRequest ? "primary" : "success"}>
                  {pendingRequest ? "Pending Upgrade Request" : "Active"}
                </Badge>
                {latestRequest ? (
                  <Badge variant={latestRequest.status === "approved" ? "success" : latestRequest.status === "rejected" ? "danger" : "neutral"}>
                    Approval Status: {latestRequest.status}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="type-label">Usage Snapshot</p>
              <h3 className="mt-2 text-xl font-black text-text-main dark:text-white">Plan limits this cycle</h3>
            </div>
            <Badge variant={currentPlan.id === "elite" || currentPlan.id === "enterprise" ? "success" : "neutral"}>
              {currentPlan.id === "enterprise" ? "Custom" : currentPlan.id === "elite" ? "Unlimited core access" : "Metered"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {usageMetrics.map((metric) => (
              <UsageMeter key={metric.label} metric={metric} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
