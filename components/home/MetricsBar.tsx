"use client";

import { Headphones, Target, Timer, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import AnimatedCounter from "./AnimatedCounter";
import FadeInSection from "./FadeInSection";

const metrics = [
  { value: 48, suffix: "h", label: "average shortlist delivery", icon: Timer },
  { value: 90, suffix: "%", label: "match accuracy", icon: Target },
  { value: 10, suffix: "k+", label: "candidate profiles", icon: Users },
  { value: 24, suffix: "/7", label: "support", icon: Headphones }
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
