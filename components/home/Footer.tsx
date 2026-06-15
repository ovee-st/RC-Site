"use client";

import Link from "next/link";
import Container from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";

const serviceLinks = [
  { label: "My Services", href: "/services" },
  { label: "We Hire For You", href: "/we-hire-for-you", hideForCandidate: true }
];

const columns = [
  { title: "Company", links: [["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"]] },
  { title: "Support", links: [["Help Center", "/help-center"], ["Terms", "/terms"]] }
] as const;

export default function Footer() {
  const { role } = useAuth();
  const visibleServiceLinks = serviceLinks.filter((link) => !(role === "candidate" && link.hideForCandidate));

  return (
    <footer className="border-t border-slate-200 bg-white/70 py-12 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="text-xl font-black text-slate-950 dark:text-white">MX Venture Lab</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">AI-powered recruitment, managed hiring, and business support for growing teams in Bangladesh.</p>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">INNOVATING TALENT. EMPOWERING GROWTH.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">Services</p>
              <div className="mt-3 space-y-2">
                {visibleServiceLinks.map((link) => (
                  <Link key={link.label} href={link.href} className="block text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-sm font-black text-slate-950 dark:text-white">{column.title}</p>
                <div className="mt-3 space-y-2">
                  {column.links.map(([label, href]) => (
                    <Link key={label} href={href} className="block text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300">
                      {label}
                    </Link>
                  ))}
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
