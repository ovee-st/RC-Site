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
          <p className="mt-5 text-base leading-8 text-text-muted dark:text-slate-300">Reach out for hiring support, subscription questions, payment verification, candidate account help, or business service inquiries.</p>
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
            <h2 className="text-xl font-black text-text-main dark:text-white">Send a message</h2>
            <form className="mt-5 grid gap-4">
              <Input name="name" placeholder="Name" />
              <Input name="email" type="email" placeholder="Email" />
              <Input name="subject" placeholder="Subject" />
              <textarea name="message" placeholder="Message" rows={6} className="rounded-md border border-border bg-white px-4 py-3 text-base font-semibold outline-none transition placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-sm dark:border-white/10 dark:bg-white/5 dark:text-white" />
              <Button type="button" className="w-full justify-center sm:w-auto">Submit Message</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
