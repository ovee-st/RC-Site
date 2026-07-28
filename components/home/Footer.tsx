"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import Container from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";

type FooterLink = { label: string; href: string; employerOnly?: boolean };

const footerColumns: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Platform",
    links: [
      { label: "Jobs", href: "/jobs" },
      { label: "Employer Plans", href: "/subscriptions" },
      { label: "Services", href: "/services" }
    ]
  },
  {
    title: "Solutions",
    links: [
      { label: "Candidate Workspace", href: "/login" },
      { label: "Employer Workspace", href: "/login", employerOnly: true },
      { label: "We Hire For You", href: "/we-hire-for-you", employerOnly: true }
    ]
  },
  {
    title: "Resources",
    links: [
      { label: "About MXVL", href: "/about" },
      { label: "Help Center", href: "/help-center" },
      { label: "Contact", href: "/contact" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Account Help", href: "/help-center" },
      { label: "Payment Support", href: "/contact" },
      { label: "Recruitment Support", href: "/contact" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" }
    ]
  }
];

export default function Footer() {
  const { role } = useAuth();
  const canSeeEmployerLinks = role !== "candidate";

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <div className="section-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
      <Container className="relative py-12 sm:py-16">
        <div className="grid gap-10 border-b border-slate-200 pb-10 dark:border-white/10 lg:grid-cols-[1.05fr_1.95fr]">
          <div>
            <Link href="/" className="focus-ring inline-flex items-center gap-3 rounded-xl" aria-label="MX Venture Lab home">
              <Image src="/mxvl-logo.webp" alt="" width={44} height={44} className="h-11 w-11 object-contain dark:hidden" />
              <Image src="/mxvl-logo-dark.webp" alt="" width={44} height={44} className="hidden h-11 w-11 object-contain dark:block" />
              <span className="text-lg font-black text-slate-950 dark:text-white">MX Venture Lab</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              AI-powered recruitment, managed hiring, and business support for teams building their next stage of growth.
            </p>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Innovating Talent. Empowering Growth.</p>
            <a
              href="mailto:support@mxventurelab.com"
              className="focus-ring mt-6 inline-flex min-h-11 items-center gap-2 rounded-control border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-soft hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-200 dark:hover:text-blue-300"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact support
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 xl:grid-cols-5" aria-label="Footer navigation">
            {footerColumns.map((column) => {
              const links = column.links.filter((link) => !link.employerOnly || canSeeEmployerLinks);
              if (!links.length) return null;
              return (
                <div key={column.title}>
                  <h2 className="text-xs font-black uppercase tracking-[0.14em] text-slate-900 dark:text-white">{column.title}</h2>
                  <ul className="mt-4 space-y-3">
                    {links.map((link) => (
                      <li key={`${column.title}-${link.label}`}>
                        <Link href={link.href} className="focus-ring rounded text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 MX Venture Lab. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" aria-hidden="true" />
            Built for responsible, human-led hiring
          </p>
        </div>
      </Container>
    </footer>
  );
}
