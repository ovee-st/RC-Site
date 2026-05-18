"use client";

import { BriefcaseBusiness, Building2, Handshake, Headset, ShieldCheck, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import FadeInSection from "./FadeInSection";

const categories = [
  { title: "White Collar", icon: Building2, text: "Admin, HR, finance, customer support, IT, operations, sales, and office roles." },
  { title: "Blue Collar", icon: BriefcaseBusiness, text: "Drivers, cleaners, security, production, hospitality, warehouse, and field teams." },
  { title: "Business Promoters", icon: Users, text: "Promoters, brand ambassadors, field activation, retail support, and campaign staff." },
  { title: "Remote Professionals", icon: Headset, text: "Remote operations, support, sales, design, and coordination teams." },
  { title: "Contract Staffing", icon: ShieldCheck, text: "Flexible workforce support for campaigns, seasonal demand, and special projects." },
  { title: "Executive Search", icon: Handshake, text: "Senior and strategic hires supported with sharper screening and recruiter context." }
];

export default function ServiceCategories() {
  return (
    <FadeInSection className="py-16 md:py-24">
      <Container>
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="primary">Service categories</Badge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">Built for high-volume hiring categories.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">MX Venture Lab supports structured recruitment across business, operations, office, field, and managed staffing needs.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((item) => (
            <Card key={item.title} variant="interactive" className="group overflow-hidden rounded-3xl p-0">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 p-5 text-white">
                <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/25 blur-xl transition group-hover:scale-125" />
                <item.icon className="relative h-9 w-9" />
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
