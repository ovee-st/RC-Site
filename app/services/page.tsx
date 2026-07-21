import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Factory,
  Gauge,
  GraduationCap,
  HeartPulse,
  Headphones,
  Layers3,
  MonitorCog,
  Rocket,
  ServerCog,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Workflow
} from "lucide-react";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { generateServiceSchema, serializeJsonLd } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore MX Venture Lab technology, workspace, facility, project management, and business operations services.",
  alternates: { canonical: "/services" }
};

const services = [
  {
    title: "IT Support Services",
    preview: "Reliable technology operations",
    description: "Maintain secure, reliable, and productive business operations through professional technical support, infrastructure management, troubleshooting, system maintenance, and technology optimization.",
    icon: ServerCog
  },
  {
    title: "Interior Design & Workspace Solutions",
    previewTitle: "Interior Design Solutions",
    preview: "Modern workspace transformation",
    description: "Design efficient and inspiring work environments through office planning, workspace optimization, renovation support, and modern interior solutions tailored to your business culture.",
    icon: MonitorCog
  },
  {
    title: "Mobile App Development",
    preview: "Custom digital solutions",
    description: "Develop scalable Android and iOS applications that improve customer engagement, automate workflows, and support business growth through innovative digital experiences.",
    icon: Smartphone
  },
  {
    title: "Business Support Services",
    preview: "Operational excellence support",
    description: "Enhance operational efficiency through administrative support, business coordination, documentation management, reporting systems, and process improvement initiatives.",
    icon: Layers3
  },
  {
    title: "Facility & Project Management",
    preview: "Structured execution & delivery",
    description: "Plan, coordinate, and execute facility operations, office expansions, renovations, vendor management, and business projects with structured oversight and measurable outcomes.",
    icon: Workflow
  }
];

const supportServices = [
  {
    title: "Technology Support",
    description: "Comprehensive IT assistance that minimizes downtime, improves reliability, and keeps teams productive.",
    items: ["Help Desk", "Maintenance", "Troubleshooting"],
    icon: Headphones
  },
  {
    title: "Workspace Development",
    description: "Create modern, productive work environments through strategic planning, design, and implementation.",
    items: ["Office Design", "Renovation", "Space Planning"],
    icon: MonitorCog
  },
  {
    title: "Business Operations Support",
    description: "Strengthen internal processes and improve day-to-day operational efficiency through dedicated support services.",
    items: ["Administration", "Documentation", "Coordination"],
    icon: Layers3
  },
  {
    title: "Facility Management",
    description: "Ensure smooth facility operations through maintenance planning, vendor coordination, asset oversight, and workplace management.",
    items: ["Facility Operations", "Vendor Management", "Maintenance Planning"],
    icon: Building2
  },
  {
    title: "Project Management",
    description: "Deliver projects successfully through structured planning, execution tracking, stakeholder management, and performance monitoring.",
    items: ["Project Planning", "Execution", "Monitoring"],
    icon: CheckCircle2
  }
];

const industries = [
  { title: "Corporate Offices", description: "Administrative, operational, and workplace support solutions for corporate organizations.", icon: Building2 },
  { title: "Logistics & Delivery", description: "Technology, workforce, and operational solutions for fast-moving logistics businesses.", icon: Truck },
  { title: "Retail & E-Commerce", description: "Digital, operational, and customer-focused solutions for modern retail businesses.", icon: ShoppingBag },
  { title: "Manufacturing", description: "Facility support, operational efficiency, and workplace optimization for production environments.", icon: Factory },
  { title: "Healthcare", description: "Support services and infrastructure solutions designed for healthcare organizations.", icon: HeartPulse },
  { title: "Education", description: "Technology and operational solutions that support learning institutions and training centers.", icon: GraduationCap },
  { title: "Startups & SMEs", description: "Flexible, scalable business support designed for growing companies and emerging ventures.", icon: Rocket }
];

const processSteps = [
  { title: "Discovery & Consultation", description: "Share your goals, challenges, and project requirements.", icon: Workflow },
  { title: "Assessment & Planning", description: "We analyze requirements and create a practical execution strategy.", icon: Sparkles },
  { title: "Execution & Delivery", description: "Our team implements the solution with clear communication and measurable milestones.", icon: CheckCircle2 },
  { title: "Support & Improvement", description: "We provide ongoing support and continuous optimization to maximize long-term value.", icon: Rocket }
];

const values = [
  { title: "Reliable Execution", description: "Focused on delivering practical outcomes through structured planning and accountability.", icon: Gauge },
  { title: "Tailored Solutions", description: "Every service is customized to match your organization's unique goals and operational requirements.", icon: Sparkles },
  { title: "Experienced Professionals", description: "Benefit from expertise across technology, facilities, operations, and project delivery.", icon: ShieldCheck },
  { title: "Long-Term Partnership", description: "We build lasting relationships through dependable support and continuous improvement.", icon: Headphones }
];

export default function ServicesPage() {
  const serviceSchema = generateServiceSchema({
    name: "MX Venture Lab Business Support Services",
    description: metadata.description as string,
    url: new URL("/services", SITE_URL).toString(),
    serviceType: services.map((service) => service.title),
    provider: { name: SITE_NAME, url: SITE_URL.toString() },
    audience: ["Businesses", "Employers", "Growing teams"],
    areaServed: "Worldwide"
  });

  return (
    <main className="overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceSchema) }} />
      <Section className="relative py-24 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_32%)]" />
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Badge variant="primary" className="type-label text-primary">Our Services</Badge>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-text-main dark:text-white sm:text-6xl">
                Business Solutions Built for Growth, Efficiency &amp; Execution
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-text-muted dark:text-slate-300">
                From technology and workplace design to operational support and project execution, MX Venture Lab delivers practical solutions that help organizations work smarter, scale faster, and operate more efficiently.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="#primary-services" className="rounded-2xl px-7 py-4 text-base font-black">
                  Explore Services <ArrowRight className="h-4 w-4" />
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
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-primary"><Sparkles className="h-6 w-6" /></div>
              </div>
              <div className="relative mt-5 grid gap-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div key={service.title} className="flex items-center gap-3 rounded-2xl border border-border bg-bg/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20"><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-text-main dark:text-white">{"previewTitle" in service ? service.previewTitle : service.title}</p>
                        <p className="text-xs font-semibold text-text-muted">{service.preview}</p>
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

      <Section id="primary-services" className="scroll-mt-24 py-16">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="primary" className="type-label text-primary">Primary Services Offered</Badge>
            <h2 className="type-h1 mt-4">Practical solutions for modern business challenges</h2>
            <p className="type-body mt-4 text-base">Whether you&apos;re launching a digital product, improving workplace efficiency, managing facilities, or strengthening business operations, MX Venture Lab delivers solutions designed around real-world business needs.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} interactive className="group rounded-2xl border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white dark:bg-primary/20"><Icon className="h-6 w-6" /></div>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {supportServices.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="rounded-2xl p-6 dark:bg-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success/10 text-success"><Icon className="h-5 w-5" /></div>
                    <div><h3 className="text-lg font-black text-text-main dark:text-white">{service.title}</h3><p className="type-body mt-2">{service.description}</p></div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">{service.items.map((item) => <Badge key={item}>{item}</Badge>)}</div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="py-16">
        <Container>
          <div className="max-w-2xl">
            <Badge variant="primary" className="type-label text-primary">Industries We Serve</Badge>
            <h2 className="type-h1 mt-4">Supporting businesses across diverse industries</h2>
            <p className="type-body mt-4 text-base">MX Venture Lab works with organizations of all sizes, helping them improve operations, technology, facilities, and workplace performance.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <Card key={industry.title} interactive className="rounded-2xl p-6 dark:bg-slate-900">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-lg font-black text-text-main dark:text-white">{industry.title}</h3>
                  <p className="type-body mt-3">{industry.description}</p>
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
            <h2 className="type-h1 mt-4">A structured path from requirement to successful delivery</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="relative rounded-2xl p-6 dark:bg-slate-900">
                  <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-white">{index + 1}</div><Icon className="h-5 w-5 text-primary" /></div>
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
          <div className="mb-10 text-center">
            <Badge variant="primary" className="type-label text-primary">Why Choose MXVL</Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} interactive className="rounded-2xl bg-gradient-to-br from-white to-blue-50/70 p-6 dark:from-slate-900 dark:to-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-lg font-black text-text-main dark:text-white">{value.title}</h3>
                  <p className="type-body mt-3">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="pb-24 pt-10">
        <Container>
          <div className="rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-14 text-center text-white shadow-primary sm:px-10">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Let&apos;s Build Smarter Operations Together</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-white/85">Whether you&apos;re improving technology, upgrading facilities, launching digital solutions, or strengthening business operations, MX Venture Lab is ready to support your next stage of growth.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/contact" variant="secondary" className="rounded-2xl border-white/30 bg-white px-7 py-4 text-base font-black text-blue-700 hover:text-blue-700">Book a Consultation</LinkButton>
              <LinkButton href="#primary-services" className="rounded-2xl bg-white/15 px-7 py-4 text-base font-black text-white ring-1 ring-white/25 hover:bg-white/20">Explore Services</LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
