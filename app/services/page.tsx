import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Code2, Gauge, Globe2, Headphones, Layers3, MonitorCog, Rocket, ServerCog, ShieldCheck, Smartphone, Sparkles, Workflow } from "lucide-react";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Services | MX Venture Lab",
  description: "Explore MX Venture Lab managed hiring, recruitment, workforce, employer support, and business operations services."
};

const services = [
  {
    title: "Managed Hiring",
    badge: "Core Service",
    preview: "End-to-end recruitment support",
    description: "Let MXVL handle candidate sourcing, screening, coordination, and shortlisting so your team can focus on selecting the right people faster.",
    icon: Code2
  },
  {
    title: "White Collar Recruitment",
    preview: "Professional talent acquisition",
    description: "Find qualified professionals across administration, finance, HR, sales, marketing, operations, customer support, and leadership positions.",
    icon: ServerCog
  },
  {
    title: "Blue Collar Recruitment",
    preview: "Reliable workforce sourcing",
    description: "Source dependable frontline workers for field operations, logistics, retail, manufacturing, support services, and operational roles.",
    icon: Smartphone
  },
  {
    title: "Business Support Services",
    preview: "Operational and administrative support",
    description: "Extend your team with operational support services including administration, coordination, documentation, reporting, and workforce management.",
    icon: Globe2
  }
];

const categoryGroups = [
  {
    title: "Talent Acquisition",
    description: "Build a stronger hiring pipeline through sourcing, screening, candidate engagement, and recruitment process optimization.",
    items: ["Candidate Sourcing", "CV Screening", "Interview Coordination"],
    icon: Headphones
  },
  {
    title: "Workforce Management",
    description: "Support growing operations through workforce planning, staffing coordination, and recruitment strategy execution.",
    items: ["Recruitment Planning", "Workforce Scaling", "Hiring Support"],
    icon: MonitorCog
  },
  {
    title: "Employer Solutions",
    description: "Customized recruitment and business support packages designed around your growth objectives.",
    items: ["Managed Hiring", "RPO Services", "Business Support"],
    icon: Layers3
  }
];

const processSteps = [
  { title: "Share Your Requirement", description: "Tell us about the role, workforce need, or business support requirement.", icon: Workflow },
  { title: "Candidate Sourcing & Screening", description: "Our team identifies, evaluates, and shortlists suitable candidates.", icon: Sparkles },
  { title: "Interview & Selection", description: "You review qualified candidates and make final hiring decisions.", icon: CheckCircle2 },
  { title: "Placement & Support", description: "We assist with onboarding coordination and ongoing support.", icon: Rocket }
];

const metrics = [
  { title: "Faster Hiring", description: "Reduce hiring delays and fill positions faster through structured recruitment processes.", icon: Gauge },
  { title: "Better Candidate Matching", description: "AI-assisted screening and experienced recruiters help identify the most suitable candidates.", icon: Sparkles },
  { title: "Verified Talent", description: "Access pre-screened professionals and workforce candidates matched to your requirements.", icon: ShieldCheck },
  { title: "Ongoing Partnership", description: "Receive continuous support throughout hiring, onboarding, and workforce expansion.", icon: Headphones }
];

export default function ServicesPage() {
  return (
    <main className="overflow-hidden">
      <Section className="relative py-24 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_32%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge variant="primary" className="type-label text-primary">Our Services</Badge>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-text-main dark:text-white sm:text-6xl">
                Reliable Recruitment &amp; Business Support Services for Growing Teams
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-text-muted dark:text-slate-300">
                From talent acquisition and managed hiring to workforce support and business operations, MX Venture Lab helps organizations build stronger teams and scale with confidence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="#primary-services" className="rounded-2xl px-7 py-4 text-base font-black">
                  Explore Services
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </div>
            </div>

            <Card className="relative overflow-hidden rounded-[2rem] border-primary/10 bg-white/90 p-6 shadow-[0_30px_100px_rgba(37,99,235,0.15)] dark:bg-slate-900/90">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative flex items-center justify-between border-b border-border pb-5 dark:border-white/10">
                <div>
                  <p className="type-label text-primary">Service Preview</p>
                  <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Primary Services Offered</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
              </div>
              <div className="relative mt-5 grid gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div key={service.title} className="flex items-center gap-3 rounded-2xl border border-border bg-bg/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-text-main dark:text-white">{service.title}</p>
                        <p className="text-xs font-semibold text-text-muted">{service.preview}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-black text-success">Available</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section id="primary-services" className="scroll-mt-24 py-16">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="primary" className="type-label text-primary">Primary Services Offered</Badge>
            <h2 className="type-h1 mt-4">From hiring challenges to workforce solutions</h2>
            <p className="type-body mt-4 text-base">Whether you&apos;re hiring your next executive, scaling frontline operations, or outsourcing recruitment activities, MX Venture Lab delivers practical workforce solutions tailored to your business needs.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} interactive className="group rounded-2xl border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white dark:bg-primary/20">
                    <Icon className="h-6 w-6" />
                  </div>
                  {service.badge ? <Badge variant="primary" className="mt-5 text-xs">{service.badge}</Badge> : null}
                  <h3 className="mt-5 text-xl font-black tracking-tight text-text-main dark:text-white">{service.title}</h3>
                  <p className="type-body mt-3">{service.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-3">
            {categoryGroups.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.title} className="rounded-2xl p-6 dark:bg-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-text-main dark:text-white">{category.title}</h3>
                      <p className="type-body mt-2">{category.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {category.items.map((item) => <Badge key={item}>{item}</Badge>)}
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="text-center">
            <Badge variant="primary" className="type-label text-primary">How It Works</Badge>
            <h2 className="type-h1 mt-4">A simple path from hiring need to successful placement</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="relative rounded-2xl p-6 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</div>
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-text-main dark:text-white">{step.title}</h3>
                  <p className="type-body mt-3">{step.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.title} interactive className="rounded-2xl bg-gradient-to-br from-white to-blue-50/70 p-6 dark:from-slate-900 dark:to-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-lg font-black text-text-main dark:text-white">{metric.title}</h3>
                  <p className="type-body mt-3">{metric.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

    </main>
  );
}
