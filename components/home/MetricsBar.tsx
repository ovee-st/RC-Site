"use client";

import { BriefcaseBusiness, Building2, Timer, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import AnimatedCounter from "./AnimatedCounter";
import FadeInSection from "./FadeInSection";

const metrics = [
  { value: 10, suffix: "k+", label: "Candidate Profiles", icon: Users },
  { value: 500, suffix: "+", label: "Active Employers", icon: Building2 },
  { value: 1000, suffix: "+", label: "Jobs Posted", icon: BriefcaseBusiness },
  { value: 48, suffix: " Hours", label: "Average Hiring Response", icon: Timer }
];

export default function MetricsBar() {
  return (
    <FadeInSection className="py-8">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="rounded-3xl p-5">
              <metric.icon className="h-5 w-5 text-blue-600" />
              <p className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white"><AnimatedCounter value={metric.value} suffix={metric.suffix} /></p>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-300">{metric.label}</p>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
