import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about MX Venture Lab, an AI-powered recruitment and business solutions platform in Bangladesh.",
  alternates: { canonical: "/about" }
};

const focusAreas = [
  "Recruitment solutions for employers and candidates",
  "Managed hiring for teams that need recruiter support",
  "White-collar recruitment across office, admin, IT, finance, HR, sales, and support roles",
  "Blue-collar recruitment for field, operations, production, warehouse, hospitality, and service roles",
  "Business support services for growing teams",
  "Employer-candidate matching powered by structured data and AI insights",
  "Hiring innovation that helps teams move from screening to confident decisions"
];

export default function AboutPage() {
  return (
    <main className="bg-bg py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">About MXVL</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">About MX Venture Lab</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">
            MX Venture Lab is a Bangladesh-based AI-powered recruitment and business solutions platform built to connect employers with qualified talent faster and more responsibly. MXVL combines managed hiring support, digital recruitment workflows, candidate profile intelligence, and practical business services for teams that want to grow with confidence.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {focusAreas.map((area) => (
            <Card key={area} className="rounded-md p-5">
              <p className="text-sm font-bold leading-6 text-text-muted dark:text-slate-300">{area}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card className="rounded-md p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Mission</p>
            <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Connect talent with opportunity.</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">We help candidates become visible to the right employers and help employers discover, evaluate, and hire people who can move their business forward.</p>
          </Card>
          <Card className="rounded-md p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Vision</p>
            <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Become the most trusted recruitment ecosystem in Bangladesh.</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">MXVL is building a reliable hiring network where technology, recruiter judgment, candidate readiness, and employer needs work together.</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
