"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ChevronRight, ClipboardCheck, Crown, Factory, Loader2, SearchCheck, Send, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import Container from "@/components/layout/Container";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const services = [
  { title: "White Collar Hiring", copy: "Specialist sourcing and assessment for professional, operational, technical, sales, finance, and administrative roles.", icon: Building2 },
  { title: "Blue Collar Hiring", copy: "Reliable workforce sourcing for production, logistics, facilities, field operations, retail, and service teams.", icon: Factory },
  { title: "Bulk Hiring", copy: "Structured high-volume campaigns with coordinated screening, documentation, scheduling, and joining support.", icon: Users },
  { title: "Executive Search", copy: "Discreet market mapping and leadership search for critical management and senior specialist appointments.", icon: Crown }
];

const processSteps = [
  ["01", "Requirement Discovery", "We align on role outcomes, hiring volume, location, compensation context, and delivery timeline."],
  ["02", "Talent Mapping", "Our specialists build a targeted sourcing plan across relevant markets, networks, and candidate pools."],
  ["03", "Screening & Assessment", "Candidates are evaluated for role fit, experience, availability, communication, and practical requirements."],
  ["04", "Shortlist & Interviews", "You receive a focused shortlist while MXVL coordinates interviews, feedback, and candidate communication."],
  ["05", "Offer & Joining Support", "We support offer alignment, documentation, follow-up, and joining readiness through closure."]
];

const benefits = [
  "Dedicated recruitment specialist",
  "Role-specific sourcing strategy",
  "Structured candidate screening",
  "Faster shortlist turnaround",
  "Interview coordination",
  "Transparent hiring progress",
  "Flexible single or bulk hiring",
  "Offer and joining follow-up"
];

const initialForm = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  hiring_type: "",
  positions_required: "",
  hiring_volume: "",
  job_location: "",
  requirement_details: ""
};

export default function ManagedHiringPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const allowed = role === "employer" || role === "admin";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/we-hire-for-you")}`);
      return;
    }
    if (!allowed) router.replace(role === "candidate" ? "/candidate" : "/");
  }, [allowed, loading, role, router, user]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const openConsultation = () => {
    setForm(initialForm);
    setMessage("");
    setSuccess(false);
    setOpen(true);
  };

  const update = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in again before submitting your request.");
      const response = await fetch("/api/hiring-consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not submit consultation request.");
      setSuccess(true);
      setMessage("Your hiring consultation request has been submitted. Our recruitment team will contact you within 24 hours.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit consultation request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user || !allowed) return <main className="grid min-h-[70vh] place-items-center bg-bg"><Loader2 className="h-7 w-7 animate-spin text-primary" /></main>;

  return (
    <main className="bg-bg text-text-main dark:bg-slate-950 dark:text-white">
      <section className="relative min-h-[calc(100svh-7rem)] max-h-[760px] overflow-hidden">
        <Image src="/managed-hiring-consultation.png" alt="Employer leaders working with recruitment specialists on a managed hiring shortlist" fill priority className="object-cover object-[68%_center]" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-950/70" />
        <Container className="relative flex min-h-[calc(100svh-7rem)] max-h-[760px] items-center py-14">
          <div className="max-w-3xl !text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
            <Badge variant="primary" className="border-white/30 bg-slate-950/45 !text-white">Employer Managed Hiring</Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight !text-white sm:text-5xl lg:text-6xl">Managed Hiring, Delivered by MXVL</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 !text-white sm:text-lg">Extend your recruitment capacity with a specialist team that sources, screens, coordinates, and supports hiring from requirement discovery through joining.</p>
            <div className="mt-7 flex flex-wrap gap-3"><Button type="button" onClick={openConsultation} className="gap-2 px-5 py-3"><ClipboardCheck className="h-4 w-4" />Request Hiring Consultation</Button><a href="#services" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Explore Services<ChevronRight className="h-4 w-4" /></a></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold !text-white"><span>Dedicated recruitment specialists</span><span>Structured shortlisting</span><span>End-to-end coordination</span></div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-surface py-16 dark:border-white/10 dark:bg-slate-900"><Container><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><Badge variant="primary">Managed Hiring Overview</Badge><h2 className="type-h1 mt-4">Recruitment capacity without expanding your internal team</h2></div><div><p className="type-body text-base leading-8">MXVL operates as an extension of your hiring function. We translate business requirements into a practical search strategy, qualify relevant candidates, manage communication, and keep the process moving with clear ownership.</p><p className="type-body mt-4 text-base leading-8">Engage us for one critical role, a recurring workforce requirement, or a coordinated hiring campaign across multiple locations.</p></div></div></Container></section>

      <section id="services" className="py-16 sm:py-20"><Container><div className="max-w-2xl"><Badge>Hiring Services</Badge><h2 className="type-h1 mt-4">Specialist support for every hiring mandate</h2><p className="type-body mt-3 text-base">Choose the delivery model that matches your workforce, urgency, and role complexity.</p></div><div className="mt-8 grid gap-4 md:grid-cols-2">{services.map(({ title, copy, icon: Icon }) => <article key={title} className="border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-slate-900"><div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><h3 className="type-h2 mt-5">{title}</h3><p className="type-body mt-3 leading-7">{copy}</p></article>)}</div></Container></section>

      <section className="border-y border-border bg-surface py-16 dark:border-white/10 dark:bg-slate-900 sm:py-20"><Container><div className="max-w-2xl"><Badge variant="primary">Hiring Process</Badge><h2 className="type-h1 mt-4">A clear path from requirement to joining</h2></div><div className="mt-9 grid gap-0 lg:grid-cols-5">{processSteps.map(([number, title, copy], index) => <div key={number} className="relative border-l border-border py-2 pl-5 pr-5 dark:border-white/10 lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pt-6"><span className="text-sm font-black text-primary">{number}</span><h3 className="mt-2 text-lg font-black">{title}</h3><p className="type-body mt-2 text-sm leading-6">{copy}</p>{index < processSteps.length - 1 ? <span className="absolute -top-1 right-0 hidden h-2 w-2 rounded-full bg-primary lg:block" /> : null}</div>)}</div></Container></section>

      <section className="py-16 sm:py-20"><Container><div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div><Badge>Benefits</Badge><h2 className="type-h1 mt-4">More control, less recruitment overhead</h2><p className="type-body mt-3 text-base leading-7">A managed model gives your team a single accountable partner while preserving visibility and decision authority.</p></div><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{benefits.map((benefit) => <div key={benefit} className="flex items-start gap-3 border-b border-border pb-4 dark:border-white/10"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /><span className="text-sm font-bold">{benefit}</span></div>)}</div></div></Container></section>

      <section className="bg-primary py-14 text-white"><Container><div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-3xl font-black">Need Hiring Support?</h2><p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/80">Tell us about your hiring requirement and our recruitment specialists will contact you within 24 hours.</p></div><Button type="button" variant="secondary" onClick={openConsultation} className="w-fit gap-2 bg-white px-5 py-3 text-primary"><Send className="h-4 w-4" />Request Hiring Consultation</Button></div></Container></section>

      {open ? <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={() => setOpen(false)}><div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-border bg-surface shadow-elevated dark:border-white/10 dark:bg-slate-950" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 dark:border-white/10 sm:px-6"><div><Badge variant="primary">Hiring Consultation</Badge><h2 className="type-h2 mt-2">Tell us what you need to hire</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-text-muted hover:bg-primary/5 hover:text-primary" aria-label="Close consultation form"><X className="h-5 w-5" /></button></div><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{success ? <div className="grid min-h-72 place-items-center text-center"><div><CheckCircle2 className="mx-auto h-12 w-12 text-success" /><h3 className="type-h2 mt-4">Request received</h3><p className="type-body mx-auto mt-3 max-w-lg">{message}</p><Button type="button" className="mt-6" onClick={() => setOpen(false)}>Close</Button></div></div> : <div className="grid gap-4 sm:grid-cols-2"><Input value={form.company_name} onChange={(event) => update("company_name", event.target.value)} placeholder="Company Name" /><Input value={form.contact_person} onChange={(event) => update("contact_person", event.target.value)} placeholder="Contact Person" /><Input value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email" type="email" /><Input value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone" /><select value={form.hiring_type} onChange={(event) => update("hiring_type", event.target.value)} className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-900"><option>White Collar Hiring</option><option>Blue Collar Hiring</option><option>Bulk Hiring</option><option>Executive Search</option><option>Mixed Workforce</option></select><Input value={form.positions_required} onChange={(event) => update("positions_required", event.target.value)} placeholder="Positions Required" /><Input value={form.hiring_volume} onChange={(event) => update("hiring_volume", event.target.value)} placeholder="Hiring Volume" type="number" min="1" /><Input value={form.job_location} onChange={(event) => update("job_location", event.target.value)} placeholder="Job Location" /><textarea value={form.requirement_details} onChange={(event) => update("requirement_details", event.target.value)} placeholder="Requirement Details" className="focus-ring min-h-36 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-900 sm:col-span-2" />{message ? <p className="text-sm font-bold text-danger sm:col-span-2">{message}</p> : null}</div>}</div>{!success ? <div className="flex justify-end gap-3 border-t border-border px-5 py-4 dark:border-white/10 sm:px-6"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{submitting ? "Submitting..." : "Submit Request"}</Button></div> : null}</div></div> : null}
    </main>
  );
}
