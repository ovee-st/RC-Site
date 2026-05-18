"use client";

import { Quote } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const testimonials = [
  { quote: "MX Venture Lab reduced our screening time by 80% and helped us hire better candidates.", name: "Tanvir Rahman", title: "Operations Lead", company: "Growth Textile Ltd" },
  { quote: "The shortlist quality is far better than manual CV filtering. We knew who to call first.", name: "Nusrat Karim", title: "HR Manager", company: "Remote Support BD" },
  { quote: "We used managed hiring for promoters and got interview-ready candidates within two days.", name: "Rahim Ahmed", title: "Founder", company: "Field Growth Co." }
];

export default function Testimonials() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 text-center">
          <Badge variant="primary">Recruiter trust</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Built for teams that need hiring speed without losing quality.</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} variant="interactive" className="rounded-3xl p-6">
              <Quote className="h-7 w-7 text-blue-600" />
              <p className="mt-5 text-base font-semibold leading-7 text-slate-700 dark:text-slate-200">“{item.quote}”</p>
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-white/10">
                <p className="font-black text-slate-950 dark:text-white">{item.name}</p>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{item.title} • {item.company}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
