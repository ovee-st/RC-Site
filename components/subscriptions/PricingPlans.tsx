"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calculator, Check, Sparkles, TrendingUp } from "lucide-react";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  EMPLOYER_PLANS,
  formatCurrencyBDT,
  getLimitLabel,
  getMonthlyEquivalent,
  getPlanPriceLabel,
  type BillingCycle
} from "@/lib/subscriptions";
import UpgradeModal from "./UpgradeModal";

export default function PricingPlans() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [modalOpen, setModalOpen] = useState(false);
  const visiblePlans = EMPLOYER_PLANS.filter((plan) =>
    billingCycle === "one_time" ? plan.billingType === "one-time" : plan.billingType !== "one-time"
  );
  const [hiresPerMonth, setHiresPerMonth] = useState(8);

  const roi = useMemo(() => {
    const manualHours = hiresPerMonth * 8;
    const mxvlHours = hiresPerMonth * 3;
    return {
      manualHours,
      mxvlHours,
      savedHours: manualHours - mxvlHours
    };
  }, [hiresPerMonth]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="relative overflow-hidden py-20 sm:py-24">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <Badge variant="primary" className="mb-5">Employer subscriptions</Badge>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Hire Smarter with MXVL Employer Plans
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Find, screen, and hire top talent faster using AI-powered recruitment tools.
            </p>

            <div className="mx-auto mt-8 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              {(["monthly", "yearly", "one_time"] as BillingCycle[]).map((cycle) => {
                const label = cycle === "one_time" ? "One-Time" : cycle === "monthly" ? "Monthly" : "Yearly";

                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBillingCycle(cycle)}
                    className={`rounded-full px-4 py-2 text-sm font-black transition sm:px-5 ${
                      billingCycle === cycle ? "bg-blue-600 text-white shadow-md" : "text-slate-600 hover:text-blue-600 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm font-bold text-emerald-600 dark:text-emerald-300">
              {billingCycle === "one_time"
                ? "One-time hiring sprint: 3 job posts + 20 CV access for 15 days"
                : "Annual Savings: 20% discount on yearly plans"}
            </p>
          </div>

          <div
            className={`relative mt-14 grid gap-5 ${
              billingCycle === "one_time"
                ? "mx-auto max-w-md"
                : "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 2xl:items-stretch"
            }`}
          >
            {visiblePlans.map((plan) => {
              const monthlyEquivalent = getMonthlyEquivalent(plan, billingCycle);
              return (
                <motion.div key={plan.id} whileHover={{ y: -8 }} transition={{ duration: 0.2 }} className={plan.highlight ? "xl:-mt-5" : ""}>
                  <Card
                    className={`flex h-full flex-col rounded-[20px] p-6 ${
                      plan.highlight
                        ? "border-blue-300 bg-gradient-to-b from-blue-600 to-blue-500 text-white shadow-[0_24px_70px_rgba(37,99,235,0.28)] dark:border-blue-400"
                        : "bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex min-h-[94px] items-start justify-between gap-3">
                      <div>
                        {plan.badge ? (
                          <Badge className="mb-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-400 dark:text-emerald-950">{plan.badge}</Badge>
                        ) : null}
                        <h2 className={`text-xl font-black ${plan.highlight ? "text-white" : "text-slate-950 dark:text-white"}`}>{plan.name}</h2>
                        <p className={`mt-2 text-sm leading-6 ${plan.highlight ? "text-blue-50" : "text-slate-600 dark:text-slate-300"}`}>{plan.tagline}</p>
                      </div>
                      <Sparkles className={`h-5 w-5 ${plan.highlight ? "text-white" : "text-blue-600"}`} />
                    </div>

                    <div className="mt-6">
                      <p className={`text-3xl font-black ${plan.highlight ? "text-white" : "text-slate-950 dark:text-white"}`}>{getPlanPriceLabel(plan, billingCycle)}</p>
                      {plan.billingType === "one-time" ? (
                        <p className={`mt-1 text-xs font-bold ${plan.highlight ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>Valid for 15 days</p>
                      ) : monthlyEquivalent ? (
                        <p className={`mt-1 text-xs font-bold ${plan.highlight ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                          {billingCycle === "yearly" ? `${formatCurrencyBDT(monthlyEquivalent)}/month equivalent` : "Billed monthly"}
                        </p>
                      ) : (
                        <p className={`mt-1 text-xs font-bold ${plan.highlight ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>Custom annual agreement</p>
                      )}
                    </div>

                    <div className="mt-6 grid gap-2 rounded-2xl border border-current/10 bg-white/10 p-4 text-sm font-bold">
                      <span>Jobs: {getLimitLabel(plan.limits.activeJobs)}</span>
                      <span>Candidate views: {getLimitLabel(plan.limits.candidateViews)}</span>
                      <span>AI credits: {getLimitLabel(plan.aiCredits)}</span>
                      <span>Recruiter seats: {getLimitLabel(plan.recruiterSeats)}</span>
                    </div>

                    <div className="mt-6 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className={`flex items-start gap-3 text-sm font-bold ${plan.highlight ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-emerald-200" : "text-emerald-500"}`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant={plan.highlight ? "secondary" : "primary"}
                      className={`mt-7 w-full justify-center ${plan.highlight ? "bg-white text-blue-700 hover:bg-blue-50" : ""}`}
                      onClick={() => setModalOpen(true)}
                    >
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>


          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              { title: "Billing operations", items: ["Monthly and annual subscriptions", "Auto-renewal status", "Invoice generation", "Billing history"] },
              { title: "Promo controls", items: ["Coupon codes", "Promo campaigns", "Annual savings badge", "Plan upgrade modals"] },
              { title: "Usage tracking", items: ["Jobs posted", "Candidate views", "Resume searches", "Recruiter seats", "AI credits used"] }
            ].map((group) => (
              <Card key={group.title} className="rounded-[20px] p-5">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">{group.title}</h3>
                <div className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <Badge variant="primary">ROI Calculator</Badge>
                  <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Estimate recruiter time saved</h3>
                </div>
              </div>
              <label className="mt-6 block text-sm font-black text-slate-700 dark:text-slate-200">
                Monthly hires: {hiresPerMonth}
              </label>
              <input
                type="range"
                min="1"
                max="40"
                value={hiresPerMonth}
                onChange={(event) => setHiresPerMonth(Number(event.target.value))}
                className="mt-4 w-full accent-blue-600"
              />
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-2xl font-black">{roi.manualHours}h</p>
                  <p className="text-xs font-bold text-slate-500">Manual review</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-2xl font-black">{roi.mxvlHours}h</p>
                  <p className="text-xs font-bold text-slate-500">With MXVL</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <p className="text-2xl font-black">{roi.savedHours}h</p>
                  <p className="text-xs font-bold">Saved monthly</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <Badge variant="success" className="mb-4">Success metrics</Badge>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-slate-800 dark:from-blue-500/10 dark:to-slate-900">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <p className="mt-4 text-3xl font-black text-slate-950 dark:text-white">40% faster</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">Companies using MXVL Growth hire 40% faster.</p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-slate-800 dark:from-emerald-500/10 dark:to-slate-900">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                  <p className="mt-4 text-3xl font-black text-slate-950 dark:text-white">60% efficient</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">Companies using MXVL Elite review candidates 60% more efficiently.</p>
                </div>
              </div>
              <div className="mt-5 rounded-[20px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300 dark:text-blue-600">AI credit system</p>
                <p className="mt-3 text-sm font-bold leading-6">Growth includes 100 AI Credits / Month. Elite includes 1000 AI Credits / Month. Enterprise includes unlimited credits.</p>
              </div>
            </Card>
          </div>
        </Container>
      </section>
      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}

