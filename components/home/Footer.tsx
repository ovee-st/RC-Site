"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";

const columns = [
  { title: "Product", links: [["Jobs", "/jobs"], ["Dashboard", "/login"], ["AI Matching", "/services"]] },
  { title: "Services", links: [["We Hire for You", "/we-hire-for-you"], ["White Collar", "/services"], ["Blue Collar", "/services"]] },
  { title: "Company", links: [["About", "/services"], ["Contact", "/services"], ["Privacy", "/privacy"]] },
  { title: "Support", links: [["Help Center", "/support"], ["Terms", "/terms"], ["Login", "/login"]] }
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70 py-12 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-xl font-black text-slate-950 dark:text-white">MX Venture Lab</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">AI-powered recruitment, managed hiring, and business support for growing teams in Bangladesh.</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Innovating Talent. Empowering Growth.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-black text-slate-950 dark:text-white">{column.title}</p>
                <div className="mt-3 space-y-2">
                  {column.links.map(([label, href]) => <Link key={label} href={href} className="block text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400">{label}</Link>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-sm font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">© 2026 MX Venture Lab. All rights reserved.</div>
      </Container>
    </footer>
  );
}
