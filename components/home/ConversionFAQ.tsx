"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import FadeInSection from "./FadeInSection";

const questions = [
  ["How does AI matching work?", "MXVL compares role requirements with profile signals such as skills, experience, availability, and preferences. The result is guidance, not an automatic hiring decision."],
  ["Can employers change AI recommendations?", "Yes. Employers can review candidates manually, adjust shortlists, and make every final decision themselves."],
  ["Will employers actually see my profile?", "Visibility depends on your profile settings, applications, and employer access. Completing your profile helps employers understand your experience when they are authorized to view it."],
  ["Can I apply to more than one job?", "Yes. You can apply to multiple relevant roles and track each application from your candidate workspace."],
  ["Can small businesses use MXVL?", "Yes. Employer options support occasional hiring, growing teams, high-volume recruitment, and custom enterprise needs."],
  ["Can employers build talent pools?", "Yes. Talent CRM tools help employers organize promising candidates for current roles and future opportunities."],
  ["Can I switch employer plans later?", "Yes. Employers can move to a different plan as hiring needs change, subject to the available upgrade and approval process."],
  ["Is AI replacing the recruiter?", "No. AI helps organize evidence and surface relevant signals. Recruiters and hiring teams remain responsible for review, communication, and decisions."]
];

export default function ConversionFAQ() {
  return (
    <FadeInSection className="section-soft py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary">Questions worth asking</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Know what to expect before you begin.</h2>
        </div>
        <Card className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-3xl p-0">
          {questions.map(([question, answer]) => (
            <details key={question} className="group border-b border-slate-200 px-5 py-4 last:border-b-0 open:bg-blue-50/50 dark:border-white/10 dark:open:bg-blue-950/20">
              <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-slate-950 marker:hidden dark:text-white sm:text-base">
                <span>{question}</span>
                <ChevronDown className="h-5 w-5 shrink-0 text-blue-600 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none dark:text-blue-300" aria-hidden="true" />
              </summary>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{answer}</p>
            </details>
          ))}
        </Card>
        <p className="mt-6 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          Need more detail?{" "}
          <Link href="/help-center" className="focus-ring inline-flex items-center gap-1 font-black text-blue-600 hover:text-blue-500 dark:text-blue-300">
            Visit the Help Center <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </Container>
    </FadeInSection>
  );
}
