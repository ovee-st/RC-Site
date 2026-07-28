import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how MX Venture Lab connects talent and employers through an AI recruitment operating system, managed hiring, and business solutions.",
  alternates: { canonical: "/about" }
};

const focusAreas = [
  "A clearer path from career discovery to a confident next move",
  "Managed hiring capacity for teams that need hands-on recruiter support",
  "Focused white-collar recruitment across professional and specialist roles",
  "Dependable blue-collar recruitment for field, operations, production, and service teams",
  "Practical business support that helps growing teams execute",
  "Evidence-based matching that brings relevant talent and opportunities into focus",
  "Connected hiring workflows that turn screening signals into better decisions"
];

export default function AboutPage() {
  return (
    <main className="bg-bg py-10 sm:py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">About MXVL</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl md:text-5xl">About MX Venture Lab</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">
            Built in Bangladesh for ambitious people and growing teams everywhere, MX Venture Lab is an AI recruitment operating system that connects career discovery, hiring workflows, talent relationships, employer branding, and managed recruitment. The result is a clearer experience for candidates and more confident decisions for employers.
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
            <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">We give candidates a fairer path to relevant work and give employers the context, tools, and support to choose people with confidence.</p>
          </Card>
          <Card className="rounded-md p-6">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Vision</p>
            <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Build a recruitment ecosystem people trust.</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted dark:text-slate-300">We are building a connected hiring network where useful technology strengthens human judgment and every participant can move forward with clarity.</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
