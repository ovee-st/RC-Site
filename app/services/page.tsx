import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Code2, Gauge, Globe2, Headphones, Layers3, MonitorCog, Rocket, ServerCog, ShieldCheck, Smartphone, Sparkles, Workflow } from "lucide-react";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Services | MX Venture Lab",
  description: "Explore MX Venture Lab software support, infrastructure solution, mobile app, and web development services."
};

const services = [
  {
    title: "Software Support",
    badge: "Core Service",
    description: "Ongoing application support, issue resolution, maintenance planning, and technical guidance to keep your software stable and efficient.",
    icon: Code2
  },
  {
    title: "Infrastructure Solution",
    description: "Network setup, systems planning, office IT environments, and infrastructure upgrades designed for stable day-to-day operations.",
    icon: ServerCog
  },
  {
    title: "Mobile App",
    description: "Android and iOS app development for startups and businesses that need user-friendly mobile products connected to real operations.",
    icon: Smartphone
  },
  {
    title: "Web Development",
    description: "Corporate websites, custom portals, and web platforms built with clean UI, responsive layouts, and business-focused functionality.",
    icon: Globe2
  }
];

const categoryGroups = [
  {
    title: "Support & Stability",
    description: "Keep daily systems running with structured maintenance, issue handling, and technical guidance.",
    items: ["Software Support", "Issue Resolution", "Maintenance Planning"],
    icon: Headphones
  },
  {
    title: "Infrastructure Delivery",
    description: "Build dependable IT environments for teams, offices, and operational workflows.",
    items: ["Network Setup", "Systems Planning", "Office IT Upgrades"],
    icon: MonitorCog
  },
  {
    title: "Product Development",
    description: "Launch responsive web and mobile products with clean interfaces and practical business functionality.",
    items: ["Mobile App", "Web Development", "Custom Portals"],
    icon: Layers3
  }
];

const processSteps = [
  { title: "Submit requirement", description: "Share the system, product, or support need your team wants to solve.", icon: Workflow },
  { title: "AI-assisted screening", description: "We structure the request, clarify scope, and identify the right delivery path.", icon: Sparkles },
  { title: "Solution shortlisting", description: "You get a focused execution plan, timeline, and service recommendation.", icon: CheckCircle2 },
  { title: "Delivery & onboarding", description: "We help implement, support, and hand over the workflow cleanly.", icon: Rocket }
];

const metrics = [
  { title: "Faster delivery", description: "Move from request to execution plan without long discovery cycles.", icon: Gauge },
  { title: "AI matching", description: "Match service needs with the right technical workflow and support model.", icon: Sparkles },
  { title: "Verified execution", description: "Practical delivery focused on stable systems and real business use cases.", icon: ShieldCheck },
  { title: "Ongoing support", description: "Support beyond launch, including maintenance planning and improvements.", icon: Headphones }
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
                Reliable IT Services For Modern Business Growth
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-text-muted dark:text-slate-300">
                A simplified service page focused on practical technology delivery, support, and product development for businesses that need dependable execution.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/login" className="rounded-2xl px-7 py-4 text-base font-black">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
                <LinkButton href="/#pricing" variant="secondary" className="rounded-2xl px-7 py-4 text-base font-black">
                  Hire for Me
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
                {services.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <div key={service.title} className="flex items-center gap-3 rounded-2xl border border-border bg-bg/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-text-main dark:text-white">{service.title}</p>
                        <p className="text-xs font-semibold text-text-muted">{index === 0 ? "Ongoing stability" : index === 1 ? "Operational infrastructure" : index === 2 ? "Mobile product delivery" : "Responsive web systems"}</p>
                      </div>
                      <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-black text-success">Ready</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="primary" className="type-label text-primary">Primary Services Offered</Badge>
            <h2 className="type-h1 mt-4">From support to full-scale product delivery</h2>
            <p className="type-body mt-4 text-base">From day-to-day software support to full-scale product delivery, MX Venture Lab helps teams build and run dependable digital systems.</p>
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
            <h2 className="type-h1 mt-4">A clear path from requirement to delivery</h2>
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

      <Section className="pb-24 pt-10">
        <Container>
          <div className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-14 text-center text-white shadow-primary sm:px-10">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Need hiring support?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-white/82">Talk to MX Venture Lab about dependable software support, infrastructure, mobile app, and web development execution.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/login" variant="secondary" className="rounded-2xl border-white/30 bg-white px-7 py-4 text-base font-black text-blue-700 hover:text-blue-700">
                Contact Us
              </LinkButton>
              <LinkButton href="/login" className="rounded-2xl bg-white/15 px-7 py-4 text-base font-black text-white ring-1 ring-white/25 hover:bg-white/20">
                Get Started
              </LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
