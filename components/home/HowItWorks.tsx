"use client";

import { ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const steps = [
  { title: "Build Your Starting Point", text: "Showcase your experience as a candidate or define what a great hire looks like for your team." },
  { title: "Discover Stronger Matches", text: "Relevant skills, experience, and role signals bring the right opportunities and people into focus." },
  { title: "Move Forward with Clarity", text: "Apply, shortlist, prepare, interview, and keep every decision and next step visible." },
  { title: "Turn the Right Match into Growth", text: "Land a role that moves your career forward or welcome a hire who strengthens your team." }
];

export default function HowItWorks() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 max-w-3xl">
          <Badge variant="primary">How it works</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">From first signal to the right next step.</h2>
        </div>
        <div className="relative grid gap-5 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-blue-200 via-blue-500 to-red-200 lg:block" />
          {steps.map((step, index) => (
            <Card key={step.title} variant="interactive" className="relative rounded-3xl p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-lg">{index + 1}</span>
                {index < steps.length - 1 ? <ArrowRight className="hidden h-5 w-5 text-blue-500 lg:block" /> : null}
              </div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
