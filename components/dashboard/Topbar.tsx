"use client";

import { Bell, Command, Search, Sparkles } from "lucide-react";
import type { CandidateProfile } from "@/types/candidate";

export default function Topbar({ profile }: { profile: CandidateProfile }) {
  return (
    <header className="sticky top-16 z-30 -mx-4 mb-6 border-b border-border bg-bg/80 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:-mx-6 sm:px-6 lg:top-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary dark:text-blue-300">Candidate Dashboard</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white sm:text-4xl">Welcome back, {profile.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-text-muted dark:text-slate-300">Your applications, interviews, documents, and AI guidance in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden min-w-[320px] items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft dark:border-white/10 dark:bg-slate-900 md:flex">
            <Search className="h-4 w-4 text-text-muted" />
            <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-text-muted dark:text-white" placeholder="Search jobs, recruiters, applications..." />
            <kbd className="rounded-lg border border-border px-2 py-1 text-xs font-bold text-text-muted dark:border-white/10"><Command className="inline h-3 w-3" /> K</kbd>
          </div>
          <button className="relative rounded-2xl border border-border bg-surface p-3 text-text-muted shadow-soft transition hover:text-primary dark:border-white/10 dark:bg-slate-900">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-success" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-500 px-4 py-3 text-sm font-black text-white shadow-[0_16px_45px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5">
            <Sparkles className="h-4 w-4" /> AI Coach
          </button>
        </div>
      </div>
    </header>
  );
}
