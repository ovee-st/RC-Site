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
  description: "Explore MX Venture Lab technology, workspace, facility, project management, and business operations services built to help growing teams execute with confidence.",
  alternates: { canonical: "/services" }
};

const services = [
  {
    title: "IT Support Services",
    preview: "Keep your team productive",
    description: "Reduce downtime, resolve technical issues faster, and keep the systems your team relies on secure and dependable.",
    icon: ServerCog
  },
  {
    title: "Interior Design & Workspace Solutions",
    previewTitle: "Interior Design Solutions",
    preview: "Make every space work harder",
    description: "Create a practical, welcoming workplace that supports how your team works today and where your business is going next.",
    icon: MonitorCog
  },
  {
    title: "Mobile App Development",
    preview: "Turn ideas into useful products",
    description: "Bring a mobile product to life that makes customer experiences easier and everyday workflows more efficient.",
    icon: Smartphone
  },
  {
    title: "Business Support Services",
    preview: "Give your team room to grow",
    description: "Take recurring coordination, documentation, and administrative work off your team so they can focus on higher-value priorities.",
    icon: Layers3
  },
  {
    title: "Facility & Project Management",
    preview: "Move complex work forward",
    description: "Keep facilities, vendors, renovations, and business projects on track with clear ownership and accountable delivery.",
    icon: Workflow
  }
];

const supportServices = [
  {
    title: "Technology Support",
    description: "Solve day-to-day IT problems quickly, reduce disruption, and give your team dependable technical support.",
    items: ["Help Desk", "Maintenance", "Troubleshooting"],
    icon: Headphones
  },
  {
    title: "Workspace Development",
    description: "Turn your workplace into an environment that helps people focus, collaborate, and do their best work.",
    items: ["Office Design", "Renovation", "Space Planning"],
    icon: MonitorCog
  },
  {
    title: "Business Operations Support",
    description: "Clear operational bottlenecks and keep important administrative work moving without overloading your core team.",
    items: ["Administration", "Documentation", "Coordination"],
    icon: Layers3
  },
  {
    title: "Facility Management",
    description: "Keep workplaces safe, reliable, and ready through proactive maintenance, vendor coordination, and asset oversight.",
    items: ["Facility Operations", "Vendor Management", "Maintenance Planning"],
    icon: Building2
  },
  {
    title: "Project Management",
    description: "Bring plans, people, and deadlines together so important projects reach the finish line with fewer surprises.",
    items: ["Project Planning", "Execution", "Monitoring"],
    icon: CheckCircle2
  }
];

const industries = [
  { title: "Corporate Offices", description: "Keep workplace operations organized, responsive, and ready to support growing teams.", icon: Building2 },
  { title: "Logistics & Delivery", description: "Improve coordination and reliability across fast-moving teams, systems, and daily operations.", icon: Truck },
  { title: "Retail & E-Commerce", description: "Strengthen the digital and operational experiences behind every customer interaction.", icon: ShoppingBag },
  { title: "Manufacturing", description: "Support safer facilities, smoother operations, and more productive production environments.", icon: Factory },
  { title: "Healthcare", description: "Build dependable infrastructure and support systems for teams focused on patient care.", icon: HeartPulse },
  { title: "Education", description: "Help learning institutions run reliable technology, facilities, and administrative operations.", icon: GraduationCap },
  { title: "Startups & SMEs", description: "Add flexible expertise and execution capacity without building every function in-house.", icon: Rocket }
];

const processSteps = [
  { title: "Tell Us What Is Holding You Back", description: "Share the outcome you need, the challenge in the way, and what success should look like.", icon: Workflow },
  { title: "Get a Practical Plan", description: "We turn your priorities into a clear scope, delivery path, and accountable next steps.", icon: Sparkles },
  { title: "See the Work Move Forward", description: "Our team delivers against visible milestones and keeps you informed without adding noise.", icon: CheckCircle2 },
  { title: "Keep Improving", description: "We stay close after delivery to solve issues, refine the work, and protect long-term value.", icon: Rocket }
];

const values = [
  { title: "Work That Gets Finished", description: "Clear ownership and visible progress keep important work moving from plan to outcome.", icon: Gauge },
  { title: "Built Around Your Reality", description: "Recommendations reflect your goals, team, constraints, and operating environment.", icon: Sparkles },
  { title: "The Right Expertise", description: "Bring in practical experience across technology, facilities, operations, and project delivery.", icon: ShieldCheck },
  { title: "Support Beyond Delivery", description: "Count on a partner who stays accountable, responsive, and focused on lasting value.", icon: Headphones }
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
                Turn Operational Challenges into Confident Progress
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-text-muted dark:text-slate-300">
                We help growing teams solve technology, workplace, facility, and execution challenges without adding unnecessary complexity.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="#primary-services" className="rounded-2xl px-7 py-4 text-base font-black">
                  Find the Right Support <ArrowRight className="h-4 w-4" />
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
            <h2 className="type-h1 mt-4">Solve the work that slows your business down</h2>
            <p className="type-body mt-4 text-base">From recurring operational pressure to a critical new project, get focused expertise that turns a real business need into practical progress.</p>
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
            <h2 className="type-h1 mt-4">Support shaped around how your industry works</h2>
            <p className="type-body mt-4 text-base">Every environment has different pressures. We adapt our people, planning, and delivery to the realities of your organization.</p>
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
            <h2 className="type-h1 mt-4">A clear path from challenge to measurable progress</h2>
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
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to Move an Important Priority Forward?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold text-white/85">Tell us what your team needs to improve, launch, or deliver. We&apos;ll help you shape a practical next step.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/contact" variant="secondary" className="rounded-2xl border-white/30 bg-white px-7 py-4 text-base font-black text-blue-700 hover:text-blue-700">Discuss Your Priority</LinkButton>
              <LinkButton href="#primary-services" className="rounded-2xl bg-white/15 px-7 py-4 text-base font-black text-white ring-1 ring-white/25 hover:bg-white/20">Review Our Capabilities</LinkButton>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
