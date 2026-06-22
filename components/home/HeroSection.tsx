"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import DashboardMockup from "./DashboardMockup";
import GradientOrbBackground from "./GradientOrbBackground";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      <GradientOrbBackground />
      <Container className="grid items-center gap-12 lg:grid-cols-[0.94fr_1.06fr]">
        <div>
          <Badge variant="primary" className="uppercase tracking-[0.16em]">AI Powered Recruitment Platform</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
            Find Jobs. Hire Talent. <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Grow Together.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Whether you&apos;re searching for your next opportunity or hiring your next employee, MX Venture Lab connects talent and employers through AI-powered matching, recruitment, and career growth tools.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/jobs" className="rounded-2xl px-7 py-4 text-base font-black shadow-glow">
              Find Jobs <ArrowRight className="ml-2 h-5 w-5" />
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="rounded-2xl px-7 py-4 text-base font-black">
              Hire Talent
            </LinkButton>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Built for candidates, employers, and growing teams.
          </p>
        </div>
        <DashboardMockup />
      </Container>
    </section>
  );
}
