import type { Metadata } from "next";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Container from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact MX Venture Lab for business inquiries, recruitment support, employer support, candidate support, and payment support.",
  alternates: { canonical: "/contact" }
};

const supportAreas = ["Business inquiries", "Recruitment support", "Employer support", "Candidate support", "Payment support"];

export default function ContactPage() {
  return (
    <main className="bg-bg py-10 sm:py-16 dark:bg-slate-950">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary">Contact</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl md:text-5xl">Contact MX Venture Lab</h1>
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">Tell us what you need help with. We&apos;ll route your message to the right MXVL team and help you move forward.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-4">
            <Card className="rounded-md p-4 sm:p-6">
              <h2 className="text-xl font-black text-text-main dark:text-white">Support areas</h2>
              <div className="mt-4 grid gap-3">
                {supportAreas.map((area) => (
                  <p key={area} className="rounded-md bg-primary/8 px-4 py-3 text-sm font-bold text-primary dark:bg-primary/15">{area}</p>
                ))}
              </div>
            </Card>
          </div>

          <Card className="rounded-md p-4 sm:p-6">
            <h2 className="text-xl font-black text-text-main dark:text-white">How can we help?</h2>
            <form className="mt-5 grid gap-4">
              <label htmlFor="contact-name" className="grid gap-2 text-sm font-bold text-text-main dark:text-white">
                Name
                <Input id="contact-name" name="name" placeholder="Your name" autoComplete="name" />
              </label>
              <label htmlFor="contact-email" className="grid gap-2 text-sm font-bold text-text-main dark:text-white">
                Email
                <Input id="contact-email" name="email" type="email" placeholder="Work or personal email" autoComplete="email" />
              </label>
              <label htmlFor="contact-subject" className="grid gap-2 text-sm font-bold text-text-main dark:text-white">
                Subject
                <Input id="contact-subject" name="subject" placeholder="What do you need help with?" />
              </label>
              <label htmlFor="contact-message" className="grid gap-2 text-sm font-bold text-text-main dark:text-white">
                Message
                <span className="text-xs font-medium text-text-muted dark:text-slate-400">Include the context our team needs to route your request correctly.</span>
                <textarea id="contact-message" name="message" placeholder="Share the details our team should know" rows={6} className="focus-ring rounded-control border border-border bg-white px-4 py-3 text-base font-medium text-text-main outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-primary/30 focus:border-primary sm:text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </label>
              <Button type="button" className="w-full justify-center sm:w-auto">Send Your Message</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
