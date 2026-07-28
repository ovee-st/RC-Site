"use client";

import { BriefcaseBusiness, Building2, Handshake, Headset, ShieldCheck, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const categories = [
  {
    title: "White Collar Jobs",
    icon: Building2,
    text: "Discover or hire for roles across admin, HR, finance, support, IT, operations, sales, and office teams.",
    label: "Office ops",
    keywords: ["Admin", "HR", "IT"],
    tone: "blue" as const
  },
  {
    title: "Blue Collar Opportunities",
    icon: BriefcaseBusiness,
    text: "Connect with practical opportunities and dependable talent across logistics, security, production, hospitality, and field teams.",
    label: "Field team",
    keywords: ["Driver", "Ops", "Shift"],
    tone: "emerald" as const
  },
  {
    title: "Business Promotions",
    icon: Users,
    text: "Find campaign work or build activation teams with promoters, brand ambassadors, retail support, and field staff.",
    label: "Campaign",
    keywords: ["Retail", "Field", "Brand"],
    tone: "violet" as const
  },
  {
    title: "Remote Careers",
    icon: Headset,
    text: "Explore flexible careers and recruit remote professionals in operations, support, sales, design, and coordination.",
    label: "Remote desk",
    keywords: ["Support", "Sales", "Design"],
    tone: "cyan" as const
  },
  {
    title: "Contract Work",
    icon: ShieldCheck,
    text: "Access flexible work or workforce support for campaigns, seasonal demand, and time-bound projects.",
    label: "Flex crew",
    keywords: ["Seasonal", "Crew", "SLA"],
    tone: "amber" as const
  },
  {
    title: "Executive Search",
    icon: Handshake,
    text: "Connect experienced leaders with senior and strategic roles through focused search and sharper screening.",
    label: "Leadership",
    keywords: ["Senior", "CXO", "Fit"],
    tone: "slate" as const
  }
];

export default function ServiceCategories() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="primary">Service categories</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-normal text-slate-950 dark:text-white md:text-5xl">Opportunities and talent across every way of working.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Candidates discover relevant work while employers reach qualified people across professional, field, remote, contract, and leadership categories.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <Card key={item.title} variant="interactive" className="group overflow-hidden rounded-2xl p-0">
              <div className="relative border-b border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="section-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <IconTile tone={item.tone} size="lg"><item.icon /></IconTile>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.label}</span>
                </div>
                <div className="relative mt-5 flex flex-wrap gap-1.5">
                  {item.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500 shadow-soft dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.text}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </FadeInSection>
  );
}
