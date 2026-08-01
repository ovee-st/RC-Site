"use client";

import { ArrowRight, BriefcaseBusiness, Handshake, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const actions = [
  { audience: "Candidates", title: "Start Your Career Journey", text: "Create your profile, explore roles, and prepare for each next step.", href: "/login", icon: UserRound, button: "Create candidate account" },
  { audience: "Employers", title: "Build Your Hiring Engine", text: "Bring jobs, candidates, interviews, offers, and talent relationships together.", href: "/subscriptions", icon: BriefcaseBusiness, button: "Explore employer plans" },
  { audience: "Managed hiring", title: "Let MXVL Recruit For You", text: "Share your requirement and let a specialist team extend your hiring capacity.", href: "/we-hire-for-you", icon: Handshake, button: "Request hiring support" }
];

export default function FinalCTA() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-[0_30px_100px_rgba(37,99,235,0.24)] sm:p-8 md:p-10" aria-labelledby="mxvl-next-step-title">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.32),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_34%)]" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">Choose your next step</p>
            <h2 id="mxvl-next-step-title" className="mt-3 max-w-4xl text-3xl font-black tracking-normal sm:text-4xl md:text-5xl">Use the platform yourself or add MXVL to your hiring team.</h2>
            <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-3">
              {actions.map((action) => { const Icon = action.icon; return <div key={action.title} className="flex min-w-0 flex-col bg-slate-950/85 p-5 backdrop-blur-sm sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-blue-300"><Icon className="h-5 w-5" /></span><p className="mt-5 text-xs font-black uppercase text-white/50">{action.audience}</p><h3 className="mt-2 text-xl font-black">{action.title}</h3><p className="mt-3 text-sm font-semibold leading-6 text-white/65">{action.text}</p><LinkButton href={action.href} variant="secondary" className="mt-6 w-full justify-between border-white/15 bg-white/10 text-white hover:bg-white/15">{action.button}<ArrowRight className="h-4 w-4" /></LinkButton></div>; })}
            </div>
          </div>
        </section>
      </Container>
    </FadeInSection>
  );
}
