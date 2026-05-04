"use client";

import { ArrowRight, Brain, CheckCircle2, KanbanSquare, Sparkles, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { StaggerContainer } from "@/components/motion/MotionSystem";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Brain, title: "AI Matching Engine", text: "Find the right candidate without manual filtering." },
  { icon: Users, title: "Candidate Scoring", text: "Compare skills, experience, category fit, and readiness in one view." },
  { icon: KanbanSquare, title: "Hiring Pipeline", text: "Move talent from applied to hired without leaving the platform." }
];

const steps = ["Submit role", "AI ranks candidates", "Review top 5-10", "Interview and hire"];
const pricing = ["Starter", "Growth", "Enterprise"];

export default function LandingPage() {
  const { user, role } = useAuth();
  const isEmployer = Boolean(user) && role === "employer";

  return (
    <main className="overflow-hidden">
      <Section className="relative pt-28 pb-24 sm:pt-32 sm:pb-28 lg:pt-36 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_70%)]" />
        <Container className="grid items-center gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <Badge variant="primary" className="type-label text-primary">AI Hiring Platform</Badge>
            <h1 className="type-h1 mt-6 max-w-4xl leading-tight">
              Hire <span className="text-primary">Top Talent</span> in 48 Hours, Not 30 Days
            </h1>
            <p className="type-body mt-6 max-w-2xl">
              Skip hundreds of applications. Our AI ranks and delivers the top 5-10 candidates ready for your role.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/login">Get Started <ArrowRight className="ml-2 h-4 w-4" /></LinkButton>
              <LinkButton href={isEmployer ? "/employer#candidates" : "/jobs"} variant="secondary">
                {isEmployer ? "Find Candidates" : "Explore Jobs"}
              </LinkButton>
            </div>
            <div className="type-body mt-3 flex flex-wrap items-center gap-3 font-semibold">
              <span>10,000+ candidates</span>
              <span>90% match accuracy</span>
              <span>48h hiring</span>
            </div>
          </div>

          <Card className="relative animate-float overflow-hidden border-primary/15 bg-surface/90 shadow-glow backdrop-blur dark:bg-slate-900/90">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="type-label text-primary">Top Matches for Your Job</p>
                <p className="type-body mt-2 text-xs">Ranked by AI based on skills, experience, and job fit</p>
              </div>
              <Sparkles className="text-primary" />
            </div>
            <StaggerContainer className="relative mt-6 grid gap-3">
              {["Md Jahid Anwar", "Nusrat Jahan", "Rahim Ahmed"].map((name, index) => (
                <Card key={name} className="flex items-center justify-between bg-bg shadow-none dark:bg-white/5">
                  <div>
                    <h3 className="type-h3 font-bold">{name}</h3>
                    <p className="mt-1 text-[11px] font-semibold text-success dark:text-emerald-300">3/4 skills matched - Strong experience fit</p>
                  </div>
                  <Badge variant="match-score">{94 - index * 6}%</Badge>
                </Card>
              ))}
            </StaggerContainer>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container className="text-center">
          <Badge variant="danger">Most companies take 30-45 days to hire.</Badge>
          <p className="type-h3 mt-2 font-bold">We reduce it to under 48 hours.</p>
        </Container>
      </Section>

      <PageContainer className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} variant="interactive">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="type-h2 mt-6">{feature.title}</h2>
            <p className="mt-3">{feature.text}</p>
          </Card>
        ))}
      </PageContainer>

      <PageContainer>
        <div className="max-w-2xl">
          <Badge variant="primary" className="type-label text-primary">Process</Badge>
          <h2 className="type-h2 mt-3">From job post to top candidates in under 48 hours</h2>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-4">
          {steps.map((step, index) => (
            <Card key={step} variant="interactive">
              <Badge variant="neutral">0{index + 1}</Badge>
              <h3 className="type-h3 mt-3">{step}</h3>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="grid gap-6 md:grid-cols-3">
        {["Blue Collar", "White Collar", "Business Promoters"].map((item) => (
          <Card key={item} variant="interactive">
            <CheckCircle2 className="text-success" />
            <h2 className="type-h2 mt-6">{item}</h2>
            <p className="mt-3">Curated categories with scored, ready-to-review candidates.</p>
          </Card>
        ))}
      </PageContainer>

      <PageContainer id="pricing">
        <div className="text-center">
          <h2 className="type-h2">Plans for every hiring pace</h2>
          <p className="mt-3">Start lean, scale when hiring volume grows.</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {pricing.map((plan, index) => (
            <Card key={plan} variant={index === 1 ? "highlighted" : "interactive"}>
              <h3 className="type-h3">{plan}</h3>
              <p className="mt-3">AI matching, recruiter workflow, and candidate access.</p>
              <p className="type-h2 mt-6 font-bold">Custom</p>
              <LinkButton href="/login" className="mt-6 w-full">Start Hiring</LinkButton>
            </Card>
          ))}
        </div>
      </PageContainer>

      <Section>
        <Container>
          <Card className="mx-auto max-w-[1000px] bg-text-main p-10 text-center text-white shadow-glow dark:bg-white dark:text-text-main">
            <h2 className="type-h1">Stop Screening. Start Hiring.</h2>
            <p className="type-body mt-3 text-white/70 dark:text-text-muted">Build a shorter path from role requirement to confident hiring decision.</p>
            <LinkButton href="/login" className="mt-6">Create Account</LinkButton>
          </Card>
        </Container>
      </Section>
    </main>
  );
}
