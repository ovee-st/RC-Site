"use client";

import { BriefcaseBusiness, CheckCircle2, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const experienceStandards = [
  {
    title: "A candidate experience built around clarity",
    audience: "For Candidates",
    description: "See applications, interview preparation, profile progress, and recommended roles without losing track of the next step.",
    points: ["Profile visibility stays manageable", "Multiple applications remain organized", "Recommendations include fit context"],
    icon: UserRound,
    tone: "blue" as const
  },
  {
    title: "An employer experience built around control",
    audience: "For Employers",
    description: "Review candidates, hiring stages, communication, and talent pipelines in one workspace while keeping every decision human.",
    points: ["AI recommendations remain editable", "Manual candidate review is always available", "Talent pools support future hiring"],
    icon: BriefcaseBusiness,
    tone: "green" as const
  }
];

function ExperienceCard({ story }: { story: (typeof experienceStandards)[number] }) {
  const Icon = story.icon;
  const blue = story.tone === "blue";

  return (
    <Card variant="interactive" className="h-full rounded-3xl p-6">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${blue ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className={`mt-5 text-xs font-black uppercase tracking-[0.16em] ${blue ? "text-blue-600 dark:text-blue-300" : "text-emerald-600 dark:text-emerald-300"}`}>{story.audience}</p>
      <h3 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{story.title}</h3>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{story.description}</p>
      <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
        {story.points.map((point) => (
          <p key={point} className="flex items-start gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${blue ? "text-blue-600" : "text-emerald-600"}`} />
            {point}
          </p>
        ))}
      </div>
    </Card>
  );
}

export default function Testimonials() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <Badge variant="primary">What you can expect</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Trust is built into the experience.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">We publish customer stories only when results and permissions can be verified. Until then, these are the product standards MXVL is designed to uphold.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {experienceStandards.map((story) => <ExperienceCard key={story.audience} story={story} />)}
        </div>
      </Container>
    </FadeInSection>
  );
}
