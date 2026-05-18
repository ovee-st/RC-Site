"use client";

import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

export default function FinalCTA() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 p-8 text-white shadow-[0_30px_100px_rgba(37,99,235,0.30)] md:p-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/60">Innovating Talent. Empowering Growth.</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Stop screening. Start hiring.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Bring job posts, AI reviews, CV support, live support, and hiring progress into one platform.</p>
            </div>
            <LinkButton href="/login" variant="secondary" className="rounded-2xl bg-white px-7 py-4 text-base font-black text-blue-700 hover:bg-white/90">
              Create Account <ArrowRight className="ml-2 h-5 w-5" />
            </LinkButton>
          </div>
        </div>
      </Container>
    </FadeInSection>
  );
}
