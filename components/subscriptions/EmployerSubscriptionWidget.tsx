"use client";

import { useMemo, useState } from "react";
import { BarChart3, Brain, CreditCard, FileSearch, ReceiptText, RotateCcw, Sparkles, TicketPercent, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  AI_CREDIT_CONSUMPTION,
  DEMO_EMPLOYER_USAGE,
  EMPLOYER_PLANS,
  getLimitLabel,
  getUsagePercent,
  type PaywallType,
  type UsageLimit
} from "@/lib/subscriptions";
import PaywallModal from "./PaywallModal";

function UsageRow({ label, used, limit }: { label: string; used: number; limit: UsageLimit }) {
  const percent = getUsagePercent(used, limit);
  const limitText = getLimitLabel(limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {used} / {limitText}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-[#0B5FFF] to-[#10B981]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function EmployerSubscriptionWidget() {
  const [paywall, setPaywall] = useState<PaywallType | null>(null);
  const currentPlan = useMemo(
    () => EMPLOYER_PLANS.find((plan) => plan.id === DEMO_EMPLOYER_USAGE.currentPlanId) ?? EMPLOYER_PLANS[1],
    []
  );

  const billingFeatures = [
    { label: "Monthly subscriptions", icon: CreditCard },
    { label: "Annual subscriptions", icon: RotateCcw },
    { label: "Coupon codes", icon: TicketPercent },
    { label: "Invoice generation", icon: ReceiptText }
  ];

  return (
    <>
      <Card className="overflow-hidden border-blue-100 bg-white p-0 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="primary" className="mb-3">Subscription</Badge>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">Employer plan and usage</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Current Plan: <span className="font-black text-slate-950 dark:text-white">{currentPlan.name}</span>. Renewal Date: {DEMO_EMPLOYER_USAGE.renewalDate}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setPaywall("candidateViews")}>Test view limit</Button>
                <LinkButton href="/subscriptions" variant="primary">Compare plans</LinkButton>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <UsageRow label="Jobs Used" used={DEMO_EMPLOYER_USAGE.jobsUsed} limit={DEMO_EMPLOYER_USAGE.jobsLimit} />
              <UsageRow label="Candidate Views" used={DEMO_EMPLOYER_USAGE.candidateViewsUsed} limit={DEMO_EMPLOYER_USAGE.candidateViewsLimit} />
              <UsageRow label="Recruiter Seats" used={DEMO_EMPLOYER_USAGE.recruiterSeatsUsed} limit={DEMO_EMPLOYER_USAGE.recruiterSeatsLimit} />
              <UsageRow label="AI Credits Used" used={DEMO_EMPLOYER_USAGE.aiCreditsUsed} limit={DEMO_EMPLOYER_USAGE.aiCreditsLimit} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {billingFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <Icon className="h-4 w-4 text-blue-600" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 p-6 text-white lg:border-l lg:border-t-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">AI credits</p>
                <h3 className="text-xl font-black">Growth includes 100 credits/month</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {AI_CREDIT_CONSUMPTION.map((item) => (
                <div key={item} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold backdrop-blur">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <Button variant="secondary" className="justify-center bg-white text-slate-950 hover:bg-white/90" onClick={() => setPaywall("aiMatching")}>
                <Brain className="h-4 w-4" /> AI Matching
              </Button>
              <Button variant="secondary" className="justify-center bg-white text-slate-950 hover:bg-white/90" onClick={() => setPaywall("resumeDatabase")}>
                <FileSearch className="h-4 w-4" /> Resume DB
              </Button>
              <Button variant="secondary" className="justify-center bg-white text-slate-950 hover:bg-white/90">
                <Users className="h-4 w-4" /> Seats
              </Button>
            </div>
            <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-bold leading-6 backdrop-blur">
              <BarChart3 className="mb-2 h-5 w-5" /> Companies using MXVL Growth hire 40% faster. Elite teams review candidates 60% more efficiently.
            </div>
          </div>
        </div>
      </Card>
      {paywall ? <PaywallModal open={Boolean(paywall)} type={paywall} onClose={() => setPaywall(null)} /> : null}
    </>
  );
}
