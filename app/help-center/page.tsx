"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";

const faqSections = [
  {
    title: "Candidate FAQs",
    questions: [
      ["How do I apply for jobs?", "Create or sign in to your candidate account, complete your profile, open a job, and submit your application through the platform."],
      ["How are candidate profiles used?", "Candidate profiles help employers and recruiters review skills, experience, resumes, applications, and AI-supported match context."],
      ["Can I update my resume?", "Yes. Candidates can update resume and profile information from the candidate dashboard so employers see current details."]
    ]
  },
  {
    title: "Employer FAQs",
    questions: [
      ["How do employer subscriptions work?", "Employers choose a subscription plan, submit payment or a coupon-supported request, and receive access after approval."],
      ["Can employers view candidate profiles?", "Candidate profile access depends on the active subscription plan and available usage limits."],
      ["What is managed hiring?", "Managed hiring means MXVL helps source, shortlist, and coordinate candidates for employers that want recruiter-led support."]
    ]
  },
  {
    title: "Subscription FAQs",
    questions: [
      ["What happens when a plan limit is reached?", "The platform may restrict plan-gated actions such as posting jobs, viewing candidates, or using AI matching until the plan is upgraded or renewed."],
      ["Can I use a coupon for subscriptions?", "Yes. Enter the coupon on the subscription payment page and apply it before submitting the request."],
      ["What happens with a full discount coupon?", "If a valid coupon reduces the final amount to zero, no transaction ID or sender number is required."]
    ]
  },
  {
    title: "Payment FAQs",
    questions: [
      ["How does manual payment verification work?", "Employers send payment to the displayed bKash or Nagad number, submit transaction details, and wait for admin verification."],
      ["What payment number should I use?", "The official bKash/Nagad number for subscription payments is 01979611120."],
      ["How long does verification take?", "Verification depends on admin review and transaction confirmation. Employers can monitor payment status from the subscription payment pages."]
    ]
  },
  {
    title: "Account FAQs",
    questions: [
      ["How do I reset my password?", "Use the sign-in flow and choose the password reset option connected to your account email."],
      ["How do I manage account information?", "Use your candidate, employer, support, or admin dashboard profile/account settings based on your role."],
      ["Who can I contact for account issues?", "Use the Contact page for candidate support, employer support, payment support, or business inquiries."]
    ]
  }
];

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
