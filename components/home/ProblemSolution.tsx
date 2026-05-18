"use client";

import { Brain, MessageSquareText, ShieldCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const cards = [
  { icon: Brain, title: "Manual screening becomes AI-ranked", text: "Your team sees the best-fit candidates first, with skills and missing gaps clearly explained." },
  { icon: MessageSquareText, title: "Support stays connected", text: "Live chat, tickets, and internal support operations sit beside the hiring workflow." },
  { icon: ShieldCheck, title: "Profiles stay structured", text: "Candidate CVs, skills, education, experience, and verification signals stay reusable everywhere." }
];

export default function ProblemSolution() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary">Why MXVL</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Hiring should not take five tabs, seven tools, and a spreadsheet.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((item) => (
            <Card key={item.title} variant="interactive" className="h-full rounded-3xl p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600/15 to-emerald-500/15 text-blue-600"><item.icon /></div>
              <h3 className="mt-5 text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
