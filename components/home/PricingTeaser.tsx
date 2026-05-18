"use client";

import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const plans = [
  { title: "Candidate Pro", icon: UserRound, items: ["Unlimited AI Career Coach", "CV downloads", "Priority visibility"], href: "/login" },
  { title: "Employer Pro", icon: BriefcaseBusiness, items: ["Advanced AI shortlists", "Premium filters", "Team collaboration"], href: "/login" }
];

export default function PricingTeaser() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <Badge variant="primary">Plans</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Upgrade when you need more hiring leverage.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">Start with the essentials, then unlock stronger AI workflows, priority visibility, and advanced recruiter collaboration.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.title} variant="interactive" className="rounded-3xl p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><plan.icon /></div>
                <h3 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">{plan.title}</h3>
                <div className="mt-5 space-y-3">
                  {plan.items.map((item) => <p key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300">{item}</p>)}
                </div>
                <LinkButton href={plan.href} variant="secondary" className="mt-6 rounded-2xl">View Plans <ArrowRight className="ml-2 h-4 w-4" /></LinkButton>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </FadeInSection>
  );
}
