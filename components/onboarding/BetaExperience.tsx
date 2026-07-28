"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bug,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Flag,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { useAuth } from "@/hooks/useAuth";
import { analyticsEvents } from "@/lib/analytics";
import {
  ADOPTION_ACTION_EVENT,
  ADOPTION_EXPERIENCES,
  ADOPTION_VERSION,
  EMPTY_ADOPTION_STATE,
  calculateChecklistProgress,
  getAdoptionStorageKey,
  normalizeAdoptionRole,
  type AdoptionAction,
  type AdoptionRole,
  type AdoptionState
} from "@/lib/adoption";
import { cn } from "@/lib/cn";

type FeedbackType = "suggestion" | "bug" | "general";

type ContextHint = {
  id: string;
  role: AdoptionRole;
  path: string;
  title: string;
  message: string;
  href: string;
  actionLabel: string;
};

const CONTEXT_HINTS: ContextHint[] = [
  { id: "candidate-resume", role: "candidate", path: "/candidate", title: "Strengthen your resume", message: "Upload your latest resume to unlock analysis and better matching context.", href: "/candidate?view=resume", actionLabel: "Open Resume Builder" },
  { id: "candidate-interview", role: "candidate", path: "/candidate/interview-prep", title: "Prepare for a specific role", message: "Choose an applied job to generate focused technical, behavioral, and situational questions.", href: "/candidate/interview-prep", actionLabel: "Start preparation" },
  { id: "employer-matching", role: "employer", path: "/employer", title: "Review the reasoning", message: "Match scores are starting points. Open candidate evidence before making a hiring decision.", href: "/employer/candidates", actionLabel: "Review candidates" },
  { id: "employer-crm", role: "employer", path: "/employer/talent-crm", title: "Keep promising candidates close", message: "Talent pools help your team rediscover people for future roles.", href: "/employer/talent-crm", actionLabel: "Explore Talent CRM" },
  { id: "admin-operations", role: "admin", path: "/admin", title: "Start with the signal", message: "Use dashboard widgets to identify where attention is needed, then open the relevant record set.", href: "/admin", actionLabel: "Review dashboard" },
  { id: "support-guides", role: "support", path: "/support", title: "Resolve with shared context", message: "Check internal feature guides before escalating common product questions.", href: "/support/knowledge-base", actionLabel: "Open feature guides" }
];

const ROUTE_ACTIONS: Array<{ role: AdoptionRole; path: string; action: AdoptionAction }> = [
  { role: "employer", path: "/employer/candidates", action: "employer_reviewed_applicants" },
  { role: "admin", path: "/admin/users", action: "admin_reviewed_users" },
  { role: "admin", path: "/admin/employers", action: "admin_reviewed_employers" },
  { role: "admin", path: "/admin/jobs", action: "admin_reviewed_jobs" },
  { role: "admin", path: "/admin/support", action: "admin_opened_support" },
  { role: "support", path: "/support/inbox", action: "support_opened_inbox" },
  { role: "support", path: "/support/tickets", action: "support_opened_ticket" },
  { role: "support", path: "/support/live-chat", action: "support_opened_live_chat" },
  { role: "support", path: "/support/knowledge-base", action: "support_opened_knowledge_base" }
];

const milestoneCopy: Partial<Record<AdoptionAction, string>> = {
  candidate_profile_completed: "Profile progress saved. Employers now have clearer evidence to review.",
  candidate_resume_uploaded: "Resume uploaded. Your document is ready for analysis.",
  candidate_first_application: "First application started. You can track progress from your candidate portal.",
  employer_profile_completed: "Company profile saved. Candidates can better understand your team.",
  employer_first_job: "First job published. Candidate discovery can now begin.",
  employer_invited_candidate: "Candidate invited. The next step is ready for follow-up.",
  employer_shortlisted_candidate: "Candidate shortlisted. Your hiring pipeline has been updated."
};

function isRoleWorkspace(pathname: string, role: AdoptionRole) {
  if (role === "candidate") return pathname === "/candidate" || pathname.startsWith("/candidate/");
  if (role === "employer") return pathname === "/employer" || pathname.startsWith("/employer/");
  if (role === "admin") return pathname === "/admin" || pathname.startsWith("/admin/");
  return pathname === "/support" || pathname.startsWith("/support/");
}

function loadState(storageKey: string): AdoptionState {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return { ...EMPTY_ADOPTION_STATE };
    const parsed = JSON.parse(saved) as Partial<AdoptionState>;
    return {
      ...EMPTY_ADOPTION_STATE,
      ...parsed,
      version: ADOPTION_VERSION,
      completedActions: Array.isArray(parsed.completedActions) ? parsed.completedActions : [],
      dismissedHints: Array.isArray(parsed.dismissedHints) ? parsed.dismissedHints : []
    };
  } catch {
    return { ...EMPTY_ADOPTION_STATE };
  }
}

function useDialogFocus(open: boolean, containerRef: RefObject<HTMLDivElement | null>, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusable = container?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [containerRef, open]);
}

export default function BetaExperience() {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();
  const reduceMotion = useReducedMotion();
  const adoptionRole = normalizeAdoptionRole(role);
  const experience = adoptionRole ? ADOPTION_EXPERIENCES[adoptionRole] : null;
  const userId = user?.id || user?.email || "";
  const storageKey = adoptionRole && userId ? getAdoptionStorageKey(userId, adoptionRole) : "";
  const [state, setState] = useState<AdoptionState>(EMPTY_ADOPTION_STATE);
  const [hydratedKey, setHydratedKey] = useState("");
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState(user?.email || "");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [milestone, setMilestone] = useState("");
  const welcomeRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  const persist = useCallback((next: AdoptionState) => {
    setState(next);
    if (storageKey) window.localStorage.setItem(storageKey, JSON.stringify(next));
  }, [storageKey]);

  useEffect(() => {
    if (loading || !storageKey) {
      // Authentication can change without remounting the global adoption layer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWelcomeOpen(false);
      setTourOpen(false);
      return;
    }
    const next = loadState(storageKey);
    setState(next);
    setHydratedKey(storageKey);
    setWelcomeOpen(false);
    setFeedbackEmail(user?.email || "");
  }, [loading, storageKey, user?.email]);

  useEffect(() => {
    if (!adoptionRole || !storageKey || hydratedKey !== storageKey || state.welcomeSeen) return;
    // The first-run prompt is derived from persisted state once auth resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomeOpen(isRoleWorkspace(pathname, adoptionRole));
  }, [adoptionRole, hydratedKey, pathname, state.welcomeSeen, storageKey]);

  useEffect(() => {
    if (!adoptionRole || !storageKey || hydratedKey !== storageKey) return;
    const routeAction = ROUTE_ACTIONS.find((item) => item.role === adoptionRole && pathname.startsWith(item.path));
    if (!routeAction || state.completedActions.includes(routeAction.action)) return;
    // Route visits are legitimate external adoption signals.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    persist({ ...state, completedActions: [...state.completedActions, routeAction.action] });
  }, [adoptionRole, hydratedKey, pathname, persist, state, storageKey]);

  useEffect(() => {
    if (!storageKey || hydratedKey !== storageKey) return;
    const handleAction = (event: Event) => {
      const action = (event as CustomEvent<AdoptionAction>).detail;
      if (!action) return;
      setState((current) => {
        if (current.completedActions.includes(action)) return current;
        const next = { ...current, completedActions: [...current.completedActions, action] };
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        const message = milestoneCopy[action];
        if (message) {
          setMilestone(message);
          window.setTimeout(() => setMilestone(""), 5200);
        }
        if (action === "candidate_profile_completed" || action === "employer_profile_completed") {
          analyticsEvents.profileCompleted(adoptionRole || "unknown");
        }
        return next;
      });
    };
    window.addEventListener(ADOPTION_ACTION_EVENT, handleAction);
    return () => window.removeEventListener(ADOPTION_ACTION_EVENT, handleAction);
  }, [adoptionRole, hydratedKey, storageKey]);

  const progress = useMemo(
    () => experience ? calculateChecklistProgress(experience.checklist, state.completedActions) : { completed: 0, total: 0, percentage: 0 },
    [experience, state.completedActions]
  );
  const currentHint = useMemo(
    () => adoptionRole
      ? CONTEXT_HINTS.find((hint) => hint.role === adoptionRole && pathname === hint.path && !state.dismissedHints.includes(hint.id))
      : null,
    [adoptionRole, pathname, state.dismissedHints]
  );

  const closeWelcome = () => {
    setWelcomeOpen(false);
    persist({ ...state, welcomeSeen: true, tourSkipped: true });
    analyticsEvents.tourSkipped(adoptionRole || "unknown");
  };
  const startTour = () => {
    const next = { ...state, welcomeSeen: true, tourSkipped: false };
    persist(next);
    setWelcomeOpen(false);
    setTourStep(0);
    setTourOpen(true);
    analyticsEvents.onboardingStarted(adoptionRole || "unknown");
  };
  const finishTour = () => {
    setTourOpen(false);
    persist({ ...state, welcomeSeen: true, tourCompleted: true, tourSkipped: false });
    analyticsEvents.onboardingCompleted(adoptionRole || "unknown");
  };
  const restartTour = () => {
    setHelpOpen(false);
    setTourStep(0);
    setTourOpen(true);
    analyticsEvents.onboardingStarted(adoptionRole || "unknown");
  };
  const openHelp = () => {
    setHelpOpen((value) => {
      if (!value) analyticsEvents.helpCenterOpened(pathname);
      return !value;
    });
  };
  const dismissHint = () => {
    if (!currentHint) return;
    persist({ ...state, dismissedHints: [...state.dismissedHints, currentHint.id] });
  };

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!feedbackMessage.trim() || !feedbackEmail.trim()) return;
    setFeedbackStatus("sending");
    const pageContext = typeof window !== "undefined" ? window.location.href : pathname;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name || "MXVL beta user",
          email: feedbackEmail.trim(),
          company: "MXVL Beta Feedback",
          message: `[${feedbackType.toUpperCase()}]\nPage: ${pageContext}\nRole: ${adoptionRole || "guest"}\n\n${feedbackMessage.trim()}`
        })
      });
      if (!response.ok) throw new Error("Feedback request failed");
      setFeedbackStatus("sent");
      setFeedbackMessage("");
      analyticsEvents.feedbackSubmitted(feedbackType, pathname);
    } catch {
      setFeedbackStatus("error");
    }
  };

  useDialogFocus(welcomeOpen, welcomeRef, closeWelcome);
  useDialogFocus(feedbackOpen, feedbackRef, () => setFeedbackOpen(false));

  useEffect(() => {
    if (progress.total && progress.completed === progress.total && !state.checklistEventSent) {
      // Persist the one-time completion event after the final checklist signal.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      persist({ ...state, checklistEventSent: true });
      analyticsEvents.checklistCompleted(adoptionRole || "unknown");
    }
  }, [adoptionRole, persist, progress.completed, progress.total, state]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" as const };

  return (
    <>
      <div className="fixed bottom-5 left-4 z-[70] sm:left-5">
        <button
          type="button"
          onClick={openHelp}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-elevated hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
          aria-expanded={helpOpen}
          aria-controls="mxvl-beta-help"
        >
          <CircleHelp className="h-5 w-5" />
          Help
          {experience && progress.completed < progress.total ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{progress.completed}/{progress.total}</span>
          ) : null}
        </button>
      </div>

      <AnimatePresence>
        {helpOpen ? (
          <motion.aside
            id="mxvl-beta-help"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={transition}
            className="fixed bottom-20 left-4 z-[75] max-h-[min(72svh,680px)] w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-elevated dark:border-white/10 dark:bg-slate-950 sm:left-5"
            aria-label="Help and onboarding"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-primary">Help & progress</p>
                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">What would help next?</h2>
              </div>
              <button type="button" onClick={() => setHelpOpen(false)} className="focus-ring grid h-11 w-11 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close help panel"><X className="h-5 w-5" /></button>
            </div>

            {experience ? (
              <section className="mt-4 rounded-md border border-slate-200 p-4 dark:border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-black text-slate-950 dark:text-white">Getting started</p><p className="text-xs font-semibold text-slate-500">{progress.percentage}% complete</p></div>
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage} aria-label="Onboarding checklist progress">
                  <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress.percentage}%` }} />
                </div>
                <div className="mt-4 grid gap-2">
                  {experience.checklist.map((item) => {
                    const complete = state.completedActions.includes(item.action);
                    return (
                      <Link key={item.action} href={item.href} onClick={() => setHelpOpen(false)} className="focus-ring flex min-h-11 items-start gap-3 rounded-md p-2 hover:bg-slate-50 dark:hover:bg-white/5">
                        <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border", complete ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400 dark:border-slate-600")}>{complete ? <Check className="h-3.5 w-3.5" /> : null}</span>
                        <span><strong className={cn("block text-sm", complete ? "text-slate-500 line-through" : "text-slate-900 dark:text-white")}>{item.label}</strong><small className="mt-0.5 block leading-5 text-slate-500 dark:text-slate-400">{item.description}</small></span>
                      </Link>
                    );
                  })}
                </div>
                <button type="button" onClick={restartTour} className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-black text-primary hover:bg-primary/5"><RotateCcw className="h-4 w-4" />Replay product tour</button>
              </section>
            ) : null}

            <nav className="mt-4 grid gap-2" aria-label="Help links">
              <Link href="/help-center" onClick={() => setHelpOpen(false)} className="focus-ring flex min-h-11 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-slate-200"><span>FAQs & getting started</span><ChevronRight className="h-4 w-4" /></Link>
              <Link href="/help-center#feature-guides" onClick={() => setHelpOpen(false)} className="focus-ring flex min-h-11 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-slate-200"><span>Feature guides</span><ChevronRight className="h-4 w-4" /></Link>
              <Link href="/contact" onClick={() => setHelpOpen(false)} className="focus-ring flex min-h-11 items-center justify-between rounded-md border border-slate-200 px-3 text-sm font-black text-slate-700 hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-slate-200"><span>Contact support</span><ChevronRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => { setHelpOpen(false); setFeedbackOpen(true); setFeedbackStatus("idle"); }} className="focus-ring flex min-h-11 items-center justify-between rounded-md bg-primary px-3 text-sm font-black text-white hover:bg-primary-hover"><span>Share beta feedback</span><MessageSquareText className="h-4 w-4" /></button>
            </nav>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {currentHint && !helpOpen && !welcomeOpen && !tourOpen ? (
          <motion.aside initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={transition} className="fixed bottom-20 left-4 z-[65] w-[calc(100vw-2rem)] max-w-xs rounded-lg border border-blue-200 bg-white p-4 shadow-elevated dark:border-blue-400/20 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1"><h2 className="text-sm font-black text-slate-950 dark:text-white">{currentHint.title}</h2><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{currentHint.message}</p></div>
              <button type="button" onClick={dismissHint} className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Dismiss feature hint"><X className="h-4 w-4" /></button>
            </div>
            <Link href={currentHint.href} onClick={dismissHint} className="focus-ring mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-black text-primary">{currentHint.actionLabel}<ChevronRight className="h-4 w-4" /></Link>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {tourOpen && experience ? (
          <motion.aside initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 14 }} transition={transition} className="fixed bottom-5 left-4 z-[90] w-[calc(100vw-2rem)] max-w-md rounded-lg border border-blue-200 bg-white p-5 shadow-elevated dark:border-blue-400/20 dark:bg-slate-950" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wide text-primary">Step {tourStep + 1} of {experience.tour.length}</p>
              <button type="button" onClick={() => { setTourOpen(false); persist({ ...state, welcomeSeen: true, tourSkipped: true }); analyticsEvents.tourSkipped(adoptionRole || "unknown"); }} className="focus-ring min-h-11 rounded-md px-2 text-xs font-black text-slate-500 hover:text-slate-900 dark:hover:text-white">Skip tour</button>
            </div>
            <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{experience.tour[tourStep].title}</h2>
            <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">{experience.tour[tourStep].description}</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link href={experience.tour[tourStep].href} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-black text-primary">{experience.tour[tourStep].actionLabel}<ChevronRight className="h-4 w-4" /></Link>
              <button type="button" onClick={() => tourStep === experience.tour.length - 1 ? finishTour() : setTourStep((value) => value + 1)} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white hover:bg-primary-hover">{tourStep === experience.tour.length - 1 ? "Finish tour" : "Continue"}<ChevronRight className="h-4 w-4" /></button>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {welcomeOpen && experience ? (
          <motion.div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <motion.div ref={welcomeRef} role="dialog" aria-modal="true" aria-labelledby="mxvl-welcome-title" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} transition={transition} className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-elevated dark:border-white/10 dark:bg-slate-950 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-wide text-primary">{experience.eyebrow}</p><h1 id="mxvl-welcome-title" className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{experience.title}</h1></div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span>
              </div>
              <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{experience.description}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {experience.welcomeItems.map((item) => <div key={item} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 dark:border-white/10"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /><span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item}</span></div>)}
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeWelcome} className="focus-ring min-h-11 rounded-md px-4 text-sm font-black text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">Skip for now</button>
                <button type="button" onClick={startTour} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-hover">Start guided tour<ChevronRight className="h-4 w-4" /></button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {feedbackOpen ? (
          <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <motion.div ref={feedbackRef} role="dialog" aria-modal="true" aria-labelledby="mxvl-feedback-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={transition} className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-elevated dark:border-white/10 dark:bg-slate-950 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-wide text-primary">Private beta</p><h2 id="mxvl-feedback-title" className="mt-1 text-xl font-black text-slate-950 dark:text-white">Share feedback with MXVL</h2><p className="mt-1 text-sm text-slate-500">The current page is included automatically so the team has useful context.</p></div>
                <button type="button" onClick={() => setFeedbackOpen(false)} className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close feedback form"><X className="h-5 w-5" /></button>
              </div>
              {feedbackStatus === "sent" ? (
                <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10" role="status">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                  <h3 className="mt-3 font-black text-emerald-900 dark:text-emerald-200">Feedback received</h3>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Thank you. Your feedback will help shape the beta.</p>
                  <button type="button" onClick={() => setFeedbackOpen(false)} className="focus-ring mt-4 min-h-11 rounded-md bg-emerald-600 px-4 text-sm font-black text-white">Done</button>
                </div>
              ) : (
                <form className="mt-5 grid gap-4" onSubmit={submitFeedback}>
                  <fieldset>
                    <legend className="text-sm font-black text-slate-800 dark:text-slate-200">Feedback type</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {([
                        { value: "suggestion", label: "Suggestion", icon: Lightbulb },
                        { value: "bug", label: "Bug", icon: Bug },
                        { value: "general", label: "General", icon: Flag }
                      ] as const).map((item) => {
                        const Icon = item.icon;
                        return <button key={item.value} type="button" onClick={() => setFeedbackType(item.value)} aria-pressed={feedbackType === item.value} className={cn("focus-ring min-h-11 rounded-md border px-2 text-xs font-black", feedbackType === item.value ? "border-primary bg-primary/10 text-primary" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300")}><Icon className="mx-auto mb-1 h-4 w-4" />{item.label}</button>;
                      })}
                    </div>
                  </fieldset>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-200">Email
                    <input type="email" required value={feedbackEmail} onChange={(event) => setFeedbackEmail(event.target.value)} className="focus-ring mt-2 min-h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                  </label>
                  <label className="text-sm font-black text-slate-800 dark:text-slate-200">What should we know?
                    <textarea required minLength={10} maxLength={3000} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} placeholder="Tell us what happened, what you expected, or what would make this easier." className="focus-ring mt-2 min-h-32 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white" />
                  </label>
                  {feedbackStatus === "error" ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">We could not send this feedback. Please try again or contact support from the Help Center.</p> : null}
                  <button type="submit" disabled={feedbackStatus === "sending" || feedbackMessage.trim().length < 10 || !feedbackEmail.trim()} className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{feedbackStatus === "sending" ? "Sending..." : "Submit feedback"}</button>
                </form>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {milestone ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={transition} role="status" aria-live="polite" className="fixed bottom-20 left-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm items-start gap-3 rounded-lg border border-emerald-200 bg-white p-4 shadow-elevated dark:border-emerald-400/20 dark:bg-slate-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div><strong className="text-sm text-slate-950 dark:text-white">Progress saved</strong><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{milestone}</p></div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
