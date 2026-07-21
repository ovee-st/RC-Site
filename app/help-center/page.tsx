"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";
import { faqSections } from "@/lib/faqContent";

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return faqSections;
    return faqSections
      .map((section) => ({
        ...section,
        questions: section.questions.filter(([question, answer]) => `${section.title} ${question} ${answer}`.toLowerCase().includes(normalizedQuery))
      }))
      .filter((section) => section.questions.length);
  }, [normalizedQuery]);

  return (
    <main className="bg-bg py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">Help Center</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">How can we help?</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">Search answers for candidate accounts, employer subscriptions, manual payment verification, coupon usage, profiles, password reset, and account management.</p>
        </div>

        <div className="relative mt-8 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search FAQs" className="pl-12" />
        </div>

        <div className="mt-10 grid gap-6">
          {filteredSections.length ? filteredSections.map((section) => (
            <Card key={section.title} className="rounded-md p-6">
              <h2 className="text-2xl font-black text-text-main dark:text-white">{section.title}</h2>
              <div className="mt-5 grid gap-4">
                {section.questions.map(([question, answer]) => (
                  <div key={question} className="rounded-md border border-border p-4 dark:border-white/10">
                    <h3 className="text-sm font-black text-text-main dark:text-white">{question}</h3>
                    <p className="mt-2 text-sm leading-7 text-text-muted dark:text-slate-300">{answer}</p>
                  </div>
                ))}
              </div>
            </Card>
          )) : (
            <Card className="rounded-md p-8 text-center">
              <p className="text-sm font-bold text-text-muted dark:text-slate-300">No FAQ matched your search.</p>
            </Card>
          )}
        </div>
      </Container>
    </main>
  );
}
