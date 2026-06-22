"use client";

import { Quote } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const candidateStories = [
  { quote: "The job matches felt relevant to my experience, and I could track every application without losing the next step.", name: "Nusrat Jahan", title: "Customer Support Professional" },
  { quote: "The resume tools helped me present my skills clearly and prepare with more confidence for interviews.", name: "Rakib Ahmed", title: "Operations Candidate" }
];

const employerStories = [
  { quote: "MX Venture Lab reduced our screening time and helped us focus first on candidates with the strongest fit.", name: "Tanvir Rahman", title: "Operations Lead, Growth Textile Ltd" },
  { quote: "Managed hiring gave us interview-ready talent quickly without losing visibility into the process.", name: "Rahim Ahmed", title: "Founder, Field Growth Co." }
];

function StoryGroup({ title, stories, tone }: { title: string; stories: typeof candidateStories; tone: "blue" | "green" }) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-black text-slate-950 dark:text-white">{title}</h3>
      <div className="grid gap-4">
        {stories.map((item) => (
          <Card key={item.name} variant="interactive" className="rounded-3xl p-6">
            <Quote className={`h-7 w-7 ${tone === "blue" ? "text-blue-600" : "text-emerald-600"}`} />
            <p className="mt-4 text-base font-semibold leading-7 text-slate-700 dark:text-slate-200">&ldquo;{item.quote}&rdquo;</p>
            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10">
              <p className="font-black text-slate-950 dark:text-white">{item.name}</p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.title}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 text-center">
          <Badge variant="primary">Success on both sides</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Better career moves. Better hires.</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <StoryGroup title="Candidate Success Stories" stories={candidateStories} tone="blue" />
          <StoryGroup title="Employer Success Stories" stories={employerStories} tone="green" />
        </div>
      </Container>
    </FadeInSection>
  );
}
