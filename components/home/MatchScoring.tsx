"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Info, Sparkles } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const scores = [
  { label: "Skills Match", value: 95, color: "bg-emerald-500" },
  { label: "Experience Match", value: 92, color: "bg-emerald-500" },
  { label: "Communication", value: 88, color: "bg-blue-500" },
  { label: "Availability", value: 96, color: "bg-emerald-500" },
  { label: "Salary Alignment", value: 90, color: "bg-yellow-400" }
];

export default function MatchScoring() {
  const reduceMotion = useReducedMotion();

  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <Card className="grid gap-8 overflow-hidden rounded-[2rem] p-6 md:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge variant="success"><Sparkles className="mr-1 h-3.5 w-3.5" /> Explainable AI</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Transparent matching for jobs and talent.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">Candidates see why a role suits their profile. Employers see why a candidate fits their requirements. Skills, experience, communication, availability, and salary alignment remain clear to both.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-950/30">
                <p className="text-xs font-black uppercase tracking-normal text-blue-600 dark:text-blue-300">For Candidates</p>
                <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Find suitable jobs with explainable recommendations.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-950/30">
                <p className="text-xs font-black uppercase tracking-normal text-emerald-600 dark:text-emerald-300">For Employers</p>
                <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Find suitable candidates with ranked fit signals.</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AI Match Score</p>
                <p className="mt-1 text-4xl font-black text-slate-950 dark:text-white">94%</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white"><Info /></div>
            </div>
            <div className="space-y-4">
              {scores.map((score, index) => (
                <div key={score.label}>
                  <div className="mb-2 flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300"><span>{score.label}</span><span>{score.value}%</span></div>
                  <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800">
                    <motion.div
                      className={`${score.color} h-2.5 rounded-full`}
                      initial={reduceMotion ? false : { width: 0 }}
                      whileInView={reduceMotion ? undefined : { width: `${score.value}%` }}
                      viewport={{ once: false }}
                      transition={{ duration: 1.1, delay: index * 0.08, repeat: Infinity, repeatType: "reverse", repeatDelay: 1.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </Container>
    </FadeInSection>
  );
}
