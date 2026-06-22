"use client";

import { BriefcaseBusiness, Building2, Handshake, Headset, ShieldCheck, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const categories = [
  {
    title: "White Collar Jobs",
    icon: Building2,
    text: "Discover or hire for roles across admin, HR, finance, support, IT, operations, sales, and office teams.",
    label: "Office ops",
    keywords: ["Admin", "HR", "IT"],
    sceneClass: "after:absolute after:right-5 after:top-5 after:h-16 after:w-24 after:rounded-2xl after:border after:border-white/25 after:bg-white/10 after:shadow-[0_16px_40px_rgba(15,23,42,0.18)] before:absolute before:right-12 before:top-12 before:h-8 before:w-16 before:rounded-lg before:border before:border-white/20 before:bg-white/10"
  },
  {
    title: "Blue Collar Opportunities",
    icon: BriefcaseBusiness,
    text: "Connect with practical opportunities and dependable talent across logistics, security, production, hospitality, and field teams.",
    label: "Field team",
    keywords: ["Driver", "Ops", "Shift"],
    sceneClass: "after:absolute after:right-5 after:top-6 after:h-14 after:w-28 after:rounded-xl after:border after:border-white/25 after:bg-white/10 before:absolute before:right-16 before:bottom-5 before:h-10 before:w-20 before:rounded-full before:border before:border-white/20 before:bg-white/10"
  },
  {
    title: "Business Promotions",
    icon: Users,
    text: "Find campaign work or build activation teams with promoters, brand ambassadors, retail support, and field staff.",
    label: "Campaign",
    keywords: ["Retail", "Field", "Brand"],
    sceneClass: "after:absolute after:right-8 after:top-5 after:h-16 after:w-16 after:rounded-full after:border after:border-white/25 after:bg-white/10 before:absolute before:right-5 before:bottom-5 before:h-8 before:w-28 before:rounded-full before:border before:border-white/20 before:bg-white/10"
  },
  {
    title: "Remote Careers",
    icon: Headset,
    text: "Explore flexible careers and recruit remote professionals in operations, support, sales, design, and coordination.",
    label: "Remote desk",
    keywords: ["Support", "Sales", "Design"],
    sceneClass: "after:absolute after:right-6 after:top-5 after:h-14 after:w-24 after:rounded-2xl after:border after:border-white/25 after:bg-white/10 before:absolute before:right-10 before:bottom-5 before:h-6 before:w-32 before:rounded-full before:border before:border-white/20 before:bg-white/10"
  },
  {
    title: "Contract Work",
    icon: ShieldCheck,
    text: "Access flexible work or workforce support for campaigns, seasonal demand, and time-bound projects.",
    label: "Flex crew",
    keywords: ["Seasonal", "Crew", "SLA"],
    sceneClass: "after:absolute after:right-5 after:top-5 after:h-16 after:w-16 after:rotate-12 after:rounded-2xl after:border after:border-white/25 after:bg-white/10 before:absolute before:right-20 before:bottom-5 before:h-8 before:w-20 before:rounded-xl before:border before:border-white/20 before:bg-white/10"
  },
  {
    title: "Executive Search",
    icon: Handshake,
    text: "Connect experienced leaders with senior and strategic roles through focused search and sharper screening.",
    label: "Leadership",
    keywords: ["Senior", "CXO", "Fit"],
    sceneClass: "after:absolute after:right-5 after:top-6 after:h-14 after:w-24 after:rounded-full after:border after:border-white/25 after:bg-white/10 before:absolute before:right-8 before:bottom-5 before:h-10 before:w-20 before:rounded-2xl before:border before:border-white/20 before:bg-white/10"
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
            <Card key={item.title} variant="interactive" className="group overflow-hidden rounded-3xl p-0">
              <div className={`relative h-28 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 p-5 text-white ${item.sceneClass}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.35),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_18px)] opacity-70" />
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-xl transition group-hover:scale-125" />
                <div className="absolute -bottom-8 left-1/2 h-24 w-36 -translate-x-1/2 rounded-full bg-slate-950/20 blur-2xl" />
                <p className="absolute bottom-4 right-5 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">{item.label}</p>
                <div className="absolute bottom-4 left-5 flex max-w-[72%] flex-wrap gap-1.5">
                  {item.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/80 backdrop-blur">
                      {keyword}
                    </span>
                  ))}
                </div>
                <item.icon className="relative z-10 h-9 w-9 drop-shadow-[0_10px_20px_rgba(15,23,42,0.25)]" />
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
