"use client";

import { KeyboardEvent, ReactNode, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, Search, UserRound, Wrench, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { demoCandidates, demoJobs } from "@/lib/demoData";
import { matchCandidateToJob } from "@/lib/ai/matching";
import { useJobStore } from "@/store/useJobStore";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

type SearchResult = {
  id: string;
  type: "job" | "candidate" | "skill";
  title: string;
  subtitle: string;
  score: number;
  href: string;
  jobId?: string;
};

const groups: Array<{ type: SearchResult["type"]; label: string }> = [
  { type: "job", label: "Jobs" },
  { type: "candidate", label: "Candidates" },
  { type: "skill", label: "Skills" }
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${escapeRegExp(query.trim())})`, "ig"));
  return (
    <>
      {parts.map((part, index) => (
        part.toLowerCase() === query.trim().toLowerCase()
          ? <mark key={`${part}-${index}`} className="rounded bg-primary/10 px-0.5 text-primary dark:bg-primary/20 dark:text-blue-300">{part}</mark>
          : <span key={`${part}-${index}`}>{part}</span>
      ))}
    </>
  );
}

function resultIcon(type: SearchResult["type"]): ReactNode {
  if (type === "job") return <BriefcaseBusiness size={17} />;
  if (type === "candidate") return <UserRound size={17} />;
  return <Wrench size={17} />;
}

function buildResults(query: string): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const jobResults = demoJobs
    .map((job) => {
      const candidateMatch = matchCandidateToJob(demoCandidates[0], job);
      const haystack = [job.title, job.company, job.location, job.category, job.skills.join(" ")].join(" ").toLowerCase();
      const matched = haystack.includes(normalized);
      const skillBoost = job.skills.some((skill) => skill.toLowerCase().includes(normalized)) ? 12 : 0;

      return {
        id: `job-${job.id}`,
        type: "job" as const,
        title: job.title,
        subtitle: `${job.company} - ${job.location}`,
        score: matched ? Math.min(100, candidateMatch.score + skillBoost) : 0,
        href: "/jobs",
        jobId: job.id
      };
    })
    .filter((result) => result.score > 0);

  const candidateResults = demoCandidates
    .map((candidate) => {
      const bestMatch = Math.max(...demoJobs.map((job) => matchCandidateToJob(candidate, job).score));
      const haystack = [candidate.name, candidate.title, candidate.category, candidate.skills.join(" ")].join(" ").toLowerCase();
      const matched = haystack.includes(normalized);
      const skillBoost = candidate.skills.some((skill) => skill.toLowerCase().includes(normalized)) ? 10 : 0;

      return {
        id: `candidate-${candidate.id}`,
        type: "candidate" as const,
        title: candidate.name,
        subtitle: `${candidate.title} - ${candidate.category}`,
        score: matched ? Math.min(100, bestMatch + skillBoost) : 0,
        href: "/employer"
      };
    })
    .filter((result) => result.score > 0);

  const skills = Array.from(new Set([...demoJobs.flatMap((job) => job.skills), ...demoCandidates.flatMap((candidate) => candidate.skills)]));
  const skillResults = skills
    .filter((skill) => skill.toLowerCase().includes(normalized))
    .map((skill) => ({
      id: `skill-${skill}`,
      type: "skill" as const,
      title: skill,
      subtitle: "Skill found in jobs and candidate profiles",
      score: 72,
      href: `/jobs?skill=${encodeURIComponent(skill)}`
    }));

  return [...jobResults, ...candidateResults, ...skillResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
}

export default function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { jobs, setSelectedJob, toggleFilter, filters } = useJobStore();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => buildResults(query), [query]);
  const open = focused && query.trim().length > 0;
  const groupedResults = groups
    .map((group) => ({
      ...group,
      results: results.filter((result) => result.type === group.type)
    }))
    .filter((group) => group.results.length > 0);

  const chooseResult = (result: SearchResult) => {
    if (result.type === "job" && result.jobId) {
      const job = jobs.find((item) => item.id === result.jobId);
      if (job) setSelectedJob(job);
    }

    if (result.type === "skill") {
      const skill = result.title;
      if (!filters.skills.includes(skill)) toggleFilter("skills", skill);
    }

    setQuery("");
    setFocused(false);
    router.push(result.href);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      chooseResult(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative w-[320px] max-w-full transition-all duration-300 focus-within:w-[420px]", className)}>
      <div className="group flex h-10 items-center gap-2 rounded-full border border-transparent bg-gray-100 px-5 py-2 shadow-none transition focus-within:border-primary/20 focus-within:bg-white focus-within:shadow-secondary focus-within:ring-4 focus-within:ring-primary/10 dark:bg-white/8 dark:focus-within:border-white/10 dark:focus-within:bg-slate-900">
        <Search size={17} className="text-text-muted transition group-focus-within:text-primary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 140)}
          onKeyDown={handleKeyDown}
          placeholder="Search jobs, candidates, skills..."
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-text-main outline-none placeholder:text-text-muted dark:text-white"
          aria-label="Global search"
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-results"
          aria-autocomplete="list"
        />
        {query ? (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="rounded-md p-1 text-text-muted hover:bg-primary/5 hover:text-primary"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        ) : (
          <kbd className="hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-muted dark:border-white/10 dark:bg-white/10 sm:inline-flex">/</kbd>
        )}
      </div>

      <AnimatePresence>
        {open ? (
        <motion.div
          id="global-search-results"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-3xl border border-border bg-surface shadow-elevated dark:border-white/10 dark:bg-surface-dark"
        >
          {results.length ? (
            <div className="max-h-[420px] overflow-y-auto p-2">
              {groupedResults.map((group) => (
                <div key={group.type} className="py-2">
                  <div className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.18em] text-text-muted">
                    {group.label}
                  </div>
                  <div className="grid gap-1">
                    {group.results.map((result) => {
                      const index = results.findIndex((item) => item.id === result.id);
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => chooseResult(result)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                            index === activeIndex ? "bg-primary/10 ring-1 ring-primary/15 dark:bg-primary/15" : "hover:bg-bg dark:hover:bg-white/5"
                          )}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary dark:bg-primary/15 dark:text-blue-300">
                            {resultIcon(result.type)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-text-main dark:text-white">
                              <Highlight text={result.title} query={query} />
                            </span>
                            <span className="mt-0.5 block truncate text-xs font-medium text-text-muted">
                              <Highlight text={result.subtitle} query={query} />
                            </span>
                          </span>
                          <Badge variant={result.score >= 80 ? "success" : result.score >= 60 ? "primary" : "neutral"} className="shrink-0">
                            {result.score}% match
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="type-h3 font-bold">No quick results</p>
              <p className="type-body mt-2 text-xs">Try a broader skill, candidate name, company, or job category.</p>
            </div>
          )}
          <div className="border-t border-border bg-bg px-4 py-2 text-[11px] font-semibold text-text-muted dark:border-white/10 dark:bg-white/5">
            Use ↑ ↓ to navigate, Enter to open
          </div>
        </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
