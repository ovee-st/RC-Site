"use client";

import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const plans = [
  {
    title: "Candidate Pro",
    icon: UserRound,
    items: ["Unlimited AI Career Coach", "CV downloads", "Priority visibility"],
    href: "/login"
  },
  {
    title: "Employer Plans",
    icon: BriefcaseBusiness,
    items: ["AI shortlists", "Talent search", "Hiring analytics"],
    href: "/subscriptions"
  }
];

export default function PricingTeaser() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <FadeInSection>
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="neutral">Flexible plans</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
              Upgrade when your hiring pipeline is ready to move faster.
            </h2>
          </div>
        </FadeInSection>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <FadeInSection key={plan.title}>
                <Card className="group h-full p-8" variant="interactive">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-950 dark:text-white">{plan.title}</h3>
                  </div>
                  <ul className="mt-6 space-y-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {plan.items.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                  <LinkButton href={plan.href} className="mt-8" variant="secondary">
                    View options <ArrowRight className="h-4 w-4" />
                  </LinkButton>
                </Card>
              </FadeInSection>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
