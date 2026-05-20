"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Send, Sparkles } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ChatMessage, { type CoachMessage } from "@/components/candidate/ChatMessage";
import PromptChips from "@/components/candidate/PromptChips";
import ProfileInsightBadges from "@/components/candidate/ProfileInsightBadges";
import { analyzeCandidateProfile, type ProfileAnalysisInput } from "@/lib/ai/profile-analysis";

const FREE_PROMPT_LIMIT = 10;

function monthKey(userId?: string) {
  const now = new Date();
  return `mxvl-career-coach:${userId || "guest"}:${now.getFullYear()}-${now.getMonth() + 1}`;
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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(storageKey) || "0");
    setPromptsUsed(Number.isFinite(saved) ? saved : 0);
  }, [storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const limitReached = !isPro && promptsUsed >= FREE_PROMPT_LIMIT;

  async function send(promptOverride?: string) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || limitReached || typing) return;

    const userMessage: CoachMessage = { role: "user", body: prompt, createdAt: formatTime() };
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
        body: JSON.stringify({ message: prompt, profile, analysis, userId, history: messages.slice(-8) })
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: "assistant", body: data.reply || fallbackReply(prompt, analysis), createdAt: formatTime() }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", body: fallbackReply(prompt, analysis), createdAt: formatTime() }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <Card className="flex min-h-[500px] flex-col overflow-hidden p-0 shadow-soft lg:h-[500px]">
      <div className="border-b border-border bg-gradient-to-br from-primary/10 via-surface to-success/10 p-3 dark:border-white/10 dark:from-blue-500/15 dark:via-surface-dark dark:to-emerald-400/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="primary">AI Career Coach</Badge>
            <h2 className="mt-1.5 text-base font-black text-text-main dark:text-white">Profile-ready career guidance</h2>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-text-muted dark:text-slate-300">Get personalized suggestions to improve your profile, CV, and interview readiness.</p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        </div>
        <div className="mt-2">
          <ProfileInsightBadges analysis={analysis} promptsUsed={promptsUsed} promptLimit={FREE_PROMPT_LIMIT} />
        </div>
      </div>

      <div className="border-b border-border bg-surface px-3 py-2 dark:border-white/10 dark:bg-surface-dark">
        <PromptChips disabled={limitReached || typing} onSelect={(prompt) => send(prompt)} />
      </div>

      {limitReached ? (
        <div className="mx-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          <Lock className="mr-1.5 inline h-3.5 w-3.5" /> Unlock Unlimited AI Career Coaching with Pro.
        </div>
      ) : null}

      <div ref={scrollRef} className="min-h-[190px] flex-1 space-y-2.5 overflow-y-auto bg-[#f0f2f5] p-3 dark:bg-slate-950/60">
        {messages.map((message, index) => <ChatMessage key={`${message.role}-${index}-${message.createdAt}`} message={message} />)}
        {typing ? (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="ml-9 inline-flex items-center gap-2 rounded-[18px] rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:240ms]" />
            Thinking
          </motion.div>
        ) : null}
      </div>

      <div className="flex items-end gap-2 border-t border-border bg-white p-2.5 dark:border-white/10 dark:bg-surface-dark">
        <input
          value={input}
          disabled={limitReached}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          placeholder={limitReached ? "Upgrade to continue coaching" : "Ask the coach..."}
          className="focus-ring min-w-0 flex-1 rounded-full border border-transparent bg-[#f0f2f5] px-4 py-2.5 text-xs font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:bg-white/10 dark:text-white"
        />
        <Button type="button" disabled={limitReached || typing || !input.trim()} onClick={() => send()} className="h-10 rounded-full px-4 text-xs shadow-sm">
          <Send className="h-3.5 w-3.5" /> Send
        </Button>
      </div>
    </Card>
  );
}

