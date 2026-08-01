import type { CommunicationRole, EngagementPriority, EngagementSignal, RecommendedAction } from "@/types/communicationCenter";

type EngagementInput = {
  role: CommunicationRole;
  category?: string | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  href?: string | null;
};

export type SmartEngagement = {
  whyItMatters: string;
  signal: EngagementSignal;
  priority: EngagementPriority;
  recommendedAction: RecommendedAction;
};

function includes(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function getSmartEngagement(input: EngagementInput): SmartEngagement {
  const value = `${input.category || ""} ${input.title || ""} ${input.summary || ""} ${input.status || ""}`.toLowerCase();
  const candidate = input.role === "candidate";
  const candidateHome = "/candidate/portal";
  const employerHome = "/employer#pipeline";

  if (includes(value, ["interview", "scheduled", "rescheduled"])) {
    return {
      whyItMatters: candidate ? "Preparation now can improve your confidence and the quality of your interview answers." : "A timely review keeps the candidate experience strong and prevents scheduling delays.",
      signal: "Recommendation",
      priority: includes(value, ["cancel", "today", "tomorrow"]) ? "urgent" : "high",
      recommendedAction: { label: candidate ? "Prepare for interview" : "Review interview plan", href: candidate ? "/candidate/interview-prep" : employerHome }
    };
  }

  if (includes(value, ["offer"])) {
    return {
      whyItMatters: candidate ? "Offers are time-sensitive and may require a response before the listed expiry date." : "Fast, clear offer follow-up reduces candidate drop-off at the final hiring stage.",
      signal: "Recommendation",
      priority: includes(value, ["expired", "declined", "withdrawn"]) ? "medium" : "urgent",
      recommendedAction: { label: candidate ? "Review offer" : "Review offer status", href: candidate ? candidateHome : employerHome }
    };
  }

  if (includes(value, ["shortlist", "top candidate", "qualified", "match", "application", "applicant"])) {
    return {
      whyItMatters: candidate ? "Employer activity is a useful signal to keep your profile current and prepare for the next hiring step." : "Qualified candidates are most actionable while their availability and interest are still current.",
      signal: includes(value, ["ai", "match", "top"]) ? "Estimate" : "Observation",
      priority: candidate ? "medium" : "high",
      recommendedAction: { label: candidate ? "Track application" : "Review candidates", href: candidate ? candidateHome : employerHome }
    };
  }

  if (includes(value, ["profile", "resume", "cv", "score"])) {
    return {
      whyItMatters: "A complete, current profile gives matching and review workflows better evidence to work with.",
      signal: includes(value, ["ai", "score"]) ? "Estimate" : "Recommendation",
      priority: "medium",
      recommendedAction: { label: candidate ? "Improve profile" : "Review candidate evidence", href: candidate ? "/candidate?view=profile" : employerHome }
    };
  }

  if (includes(value, ["subscription", "payment", "invoice", "renewal"])) {
    return {
      whyItMatters: "Resolving account changes early helps prevent interruptions to active recruitment work.",
      signal: "Observation",
      priority: includes(value, ["expired", "failed", "due"]) ? "urgent" : "high",
      recommendedAction: { label: "Review subscription", href: candidate ? candidateHome : "/employer#account-settings" }
    };
  }

  if (includes(value, ["task", "reminder", "follow-up", "closing soon", "bottleneck"])) {
    return {
      whyItMatters: candidate ? "Completing the next step keeps your application and profile ready for employer review." : "Unresolved work can slow the pipeline and weaken the candidate experience.",
      signal: "Recommendation",
      priority: includes(value, ["overdue", "urgent", "closing"]) ? "urgent" : "high",
      recommendedAction: { label: candidate ? "Continue journey" : "Open task", href: candidate ? candidateHome : employerHome }
    };
  }

  if (includes(value, ["message", "email", "communication"])) {
    return {
      whyItMatters: "A prompt response keeps expectations clear and the recruitment conversation moving.",
      signal: "Observation",
      priority: "medium",
      recommendedAction: { label: "Open conversation", href: input.href || "/communication-center?section=messages" }
    };
  }

  return {
    whyItMatters: "This update may affect the next step in your recruitment journey.",
    signal: "Observation",
    priority: "low",
    recommendedAction: { label: candidate ? "Open candidate portal" : "Open hiring workspace", href: input.href || (candidate ? candidateHome : employerHome) }
  };
}
