"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import DashboardMockup from "./DashboardMockup";
import GradientOrbBackground from "./GradientOrbBackground";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-10 sm:py-16 md:py-20 lg:py-32">
      <GradientOrbBackground />
      <Container className="grid items-center gap-8 md:gap-10 xl:grid-cols-[minmax(29rem,0.84fr)_minmax(0,1.16fr)] xl:gap-8">
        <div className="min-w-0 text-center sm:text-left">
          <Badge variant="primary" className="uppercase tracking-[0.16em]">AI Recruitment Operating System</Badge>
          <h1 className="mx-auto mt-4 max-w-4xl text-balance break-normal text-[clamp(2.5rem,12vw,3.6rem)] font-black leading-[1.02] tracking-normal text-slate-950 [overflow-wrap:normal] [word-break:normal] dark:text-white sm:mx-0 sm:mt-6 sm:text-6xl xl:text-[3.5rem]">
            One operating system <span className="xl:block xl:whitespace-nowrap">for <span className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">recruitment.</span></span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:mx-0 sm:mt-6 sm:text-lg sm:leading-8">
            Candidates improve how they present, apply, and prepare. Employers source, evaluate, interview, hire, and nurture talent in one connected workspace.
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
            <LinkButton href="/jobs" className="w-full rounded-2xl px-4 py-4 text-sm font-black shadow-glow sm:w-auto sm:px-7 sm:text-base">
              Start Your Career Journey <ArrowRight className="ml-2 h-5 w-5" />
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="w-full rounded-2xl px-4 py-4 text-sm font-black sm:w-auto sm:px-7 sm:text-base">
              Build Your Hiring Engine
            </LinkButton>
          </div>
          <p className="mt-4 flex items-start justify-center gap-2 text-left text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400 sm:mt-5 sm:items-center sm:justify-start sm:text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Explainable AI informs each step. People remain in control.
          </p>
        </div>
        <DashboardMockup />
      </Container>
    </section>
  );
}
