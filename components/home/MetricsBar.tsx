"use client";

import { Eye, Layers3, ShieldCheck, UserCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const trustSignals = [
  { value: "Human control", label: "AI supports decisions. People make them.", icon: UserCheck },
  { value: "Role-aware access", label: "Candidate and employer experiences stay appropriately separated.", icon: ShieldCheck },
  { value: "Visible reasoning", label: "Match signals explain why a role or candidate may fit.", icon: Eye },
  { value: "One workflow", label: "Applications, interviews, talent, and hiring progress stay connected.", icon: Layers3 }
];

export default function MetricsBar() {
  return (
    <FadeInSection className="py-8">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustSignals.map((signal) => (
            <Card key={signal.value} className="rounded-3xl p-5">
              <signal.icon className="h-5 w-5 text-blue-600" />
              <p className="mt-4 text-lg font-black tracking-normal text-slate-950 dark:text-white">{signal.value}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">{signal.label}</p>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
