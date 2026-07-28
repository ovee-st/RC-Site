"use client";

import { ArrowRight, BriefcaseBusiness, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

export default function FinalCTA() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-white shadow-[0_30px_100px_rgba(37,99,235,0.30)] md:p-12">
          <div className="relative text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Innovating Talent. Empowering Growth.</p>
            <h2 className="mx-auto mt-3 max-w-4xl text-4xl font-black tracking-normal md:text-6xl">Make Your Next Career Move.<br />Build Your Next Great Team.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/75">Move from search to decision with clearer matches, practical guidance, and every next step in one place.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/login" variant="secondary" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-blue-700 hover:bg-white/90">
                <UserRound className="mr-2 h-5 w-5" /> Launch Your Career
              </LinkButton>
              <LinkButton href="/login" className="rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-base font-black text-white hover:bg-white/20">
                <BriefcaseBusiness className="mr-2 h-5 w-5" /> Start Hiring Smarter <ArrowRight className="ml-2 h-5 w-5" />
              </LinkButton>
            </div>
          </div>
        </div>
      </Container>
    </FadeInSection>
  );
}
