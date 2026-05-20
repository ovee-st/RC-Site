"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Expand, Lock, Send, Sparkles, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ChatMessage, { type CoachMessage } from "@/components/candidate/ChatMessage";
import PromptChips from "@/components/candidate/PromptChips";
import ProfileInsightBadges from "@/components/candidate/ProfileInsightBadges";
import { analyzeCandidateProfile, type ProfileAnalysisInput } from "@/lib/ai/profile-analysis";

const FREE_PROMPT_LIMIT = 20;

function getMonthlyUsagePeriod() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).format(new Date());
}

function monthKey(userId?: string) {
  return `mxvl-career-coach:${userId || "guest"}:${getMonthlyUsagePeriod()}`;
}

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fallbackReply(prompt: string, analysis: ReturnType<typeof analyzeCandidateProfile>) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("summary")) {
    return `Your summary should lead with role fit, years of experience, and measurable impact. Based on your profile, add one line about ownership, one line about tools/skills, and one line about outcomes. Current profile score: ${analysis.profileCompletionScore}%.`;
  }
  if (lowerPrompt.includes("skill")) {
    return analysis.missingSkills.length
      ? `Add or validate these skills first: ${analysis.missingSkills.join(", ")}. They are common recruiter filters and can improve your match quality.`
      : "Your core skill coverage looks strong. Next, reorder your skills so the most job-relevant ones appear first.";
  }
  if (lowerPrompt.includes("experience")) {
    return "Rewrite each experience bullet using this pattern: action + scope + measurable result. Example: Coordinated vendor operations across multiple sites, reducing follow-up delays and improving reporting accuracy.";
  }
  if (lowerPrompt.includes("ats") || lowerPrompt.includes("cv")) {
    return `Your ATS score is ${analysis.atsScore}%. Improve it by adding exact job-title keywords, measurable achievements, and 6-8 role-specific skills from your target jobs.`;
  }
  if (lowerPrompt.includes("certification")) {
    return "Prioritize certifications that prove execution in your target category: HR operations, Excel/reporting, customer support systems, project coordination, or industry-specific compliance.";
  }
  return analysis.recommendations[0] || "Focus on clearer profile positioning, stronger keywords, and measurable experience details to improve recruiter confidence.";
}

export default function AIProfileCoach({ profile, userId, plan = "Basic" }: { profile: ProfileAnalysisInput; userId?: string; plan?: string }) {
  const analysis = useMemo(() => analyzeCandidateProfile(profile), [profile]);
  const usagePeriod = getMonthlyUsagePeriod();
  const storageKey = monthKey(userId);
  const isPro = plan.toLowerCase() === "pro";
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: "assistant",
      body: `I reviewed your profile. Your profile score is ${analysis.profileCompletionScore}% and ATS score is ${analysis.atsScore}%. Ask me to improve your summary, skills, experience, or CV keywords.`,
      createdAt: formatTime()
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [promptsUsed, setPromptsUsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant")?.body || messages[0]?.body;

  useEffect(() => {
    let cancelled = false;
    const saved = Number(window.localStorage.getItem(storageKey) || "0");
    setPromptsUsed(Number.isFinite(saved) ? saved : 0);

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(`mxvl-career-coach:${userId || "guest"}:`) && key !== storageKey)
      .forEach((key) => window.localStorage.removeItem(key));

    if (!userId) return () => { cancelled = true; };

    fetch(`/api/ai/career-coach?userId=${encodeURIComponent(userId)}&period=${encodeURIComponent(usagePeriod)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const used = Number(data?.usage?.used);
        if (!cancelled && Number.isFinite(used)) {
          setPromptsUsed(used);
          window.localStorage.setItem(storageKey, String(used));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [storageKey, usagePeriod, userId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, chatOpen]);

  const limitReached = !isPro && promptsUsed >= FREE_PROMPT_LIMIT;

  async function send(promptOverride?: string) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || limitReached || typing) return;

    const userMessage: CoachMessage = { role: "user", body: prompt, createdAt: formatTime() };
    setChatOpen(true);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setTyping(true);

    const nextUsage = promptsUsed + 1;
    setPromptsUsed(nextUsage);
    window.localStorage.setItem(storageKey, String(nextUsage));

    try {
      const response = await fetch("/api/ai/career-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, profile, analysis, userId, plan, usagePeriod, history: messages.slice(-8) })
      });
      const data = await response.json();
      const monthlyUsed = Number(data?.usage?.used);
      if (Number.isFinite(monthlyUsed)) {
        setPromptsUsed(monthlyUsed);
        window.localStorage.setItem(storageKey, String(monthlyUsed));
      }
      setMessages((current) => [...current, { role: "assistant", body: data.reply || fallbackReply(prompt, analysis), createdAt: formatTime() }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", body: fallbackReply(prompt, analysis), createdAt: formatTime() }]);
    } finally {
      setTyping(false);
    }
  }

  const coachComposer = (
    <div className="flex items-end gap-2 border-t border-border bg-white p-3 dark:border-white/10 dark:bg-surface-dark">
      <textarea
        value={input}
        disabled={limitReached}
        rows={2}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        placeholder={limitReached ? "Upgrade to continue coaching" : "Type your career question..."}
        className="focus-ring min-h-[48px] max-h-32 min-w-0 flex-1 resize-none rounded-2xl border border-transparent bg-[#f0f2f5] px-4 py-3 text-sm font-semibold leading-5 text-slate-800 outline-none placeholder:text-slate-400 dark:bg-white/10 dark:text-white"
      />
      <Button type="button" disabled={limitReached || typing || !input.trim()} onClick={() => send()} className="h-12 rounded-2xl px-5 text-sm shadow-sm">
        <Send className="h-4 w-4" /> Send
      </Button>
    </div>
  );

  return (
    <>
      <Card className="flex flex-col overflow-hidden p-0 shadow-soft">
        <div className="border-b border-border bg-gradient-to-br from-primary/10 via-white to-success/10 p-3.5 dark:border-white/10 dark:from-blue-500/15 dark:via-surface-dark dark:to-emerald-400/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant="primary">AI Career Coach</Badge>
              <h2 className="mt-1.5 text-lg font-black text-text-main dark:text-white">Profile-ready career guidance</h2>
              <p className="mt-1 text-xs font-semibold leading-5 text-text-muted dark:text-slate-300">Get personalized suggestions to improve your profile, CV, and interview readiness.</p>
            </div>
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          </div>
          <div className="mt-3">
            <ProfileInsightBadges analysis={analysis} promptsUsed={promptsUsed} promptLimit={FREE_PROMPT_LIMIT} />
          </div>
        </div>

        <div className="space-y-3 p-3.5">
          <div className="overflow-hidden border-b border-border pb-3 dark:border-white/10">
            <PromptChips disabled={limitReached || typing} onSelect={(prompt) => send(prompt)} />
          </div>

          {limitReached ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
              <Lock className="mr-1.5 inline h-3.5 w-3.5" /> Unlock Unlimited AI Career Coaching with Pro.
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="group w-full rounded-3xl border border-slate-200 bg-[#f7f9fc] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-slate-950/50 dark:hover:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900 dark:text-white">Open AI Coach chat</p>
                  <Expand className="h-4 w-4 shrink-0 text-primary transition group-hover:scale-110" />
                </div>
                <p className="mt-1 max-h-12 overflow-hidden text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">{latestAssistant}</p>
              </div>
            </div>
          </button>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => setChatOpen(true)} className="rounded-2xl px-4 py-3">
              <Expand className="h-4 w-4" /> Expand chat
            </Button>
            <Button type="button" variant="secondary" onClick={() => setChatOpen(true)} className="rounded-2xl px-4 py-3">
              Type a custom question
            </Button>
          </div>
        </div>
      </Card>

      {chatOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-950"
          >
            <div className="border-b border-border bg-gradient-to-r from-primary/10 via-white to-success/10 p-3.5 dark:border-white/10 dark:via-slate-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="primary">AI Career Coach</Badge>
                  <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Career coach chat</h3>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Ask detailed questions. Use Shift + Enter for a new line.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  aria-label="Close AI coach chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-3">
                <ProfileInsightBadges analysis={analysis} promptsUsed={promptsUsed} promptLimit={FREE_PROMPT_LIMIT} />
              </div>
              <div className="mt-3 overflow-hidden">
                <PromptChips disabled={limitReached || typing} onSelect={(prompt) => send(prompt)} />
              </div>
            </div>

            {limitReached ? (
              <div className="mx-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                <Lock className="mr-1.5 inline h-3.5 w-3.5" /> Unlock Unlimited AI Career Coaching with Pro.
              </div>
            ) : null}

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[#f5f6f8] p-4 dark:bg-slate-950/60 sm:p-5">
              {messages.map((message, index) => <ChatMessage key={`${message.role}-${index}-${message.createdAt}`} message={message} />)}
              {typing ? (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="ml-10 inline-flex items-center gap-2 rounded-[20px] rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
                  Thinking
                </motion.div>
              ) : null}
            </div>

            {coachComposer}
          </motion.div>
        </div>
      ) : null}
    </>
  );
}
