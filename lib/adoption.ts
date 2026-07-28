export const ADOPTION_ACTION_EVENT = "mxvl-adoption-action";
export const ADOPTION_STORAGE_PREFIX = "mxvl:beta:onboarding";
export const ADOPTION_VERSION = 1;

export type AdoptionRole = "candidate" | "employer" | "admin" | "support";

export type AdoptionAction =
  | "candidate_profile_completed"
  | "candidate_resume_uploaded"
  | "candidate_experience_added"
  | "candidate_first_application"
  | "employer_profile_completed"
  | "employer_first_job"
  | "employer_reviewed_applicants"
  | "employer_invited_candidate"
  | "employer_shortlisted_candidate"
  | "admin_reviewed_users"
  | "admin_reviewed_employers"
  | "admin_opened_support"
  | "admin_reviewed_jobs"
  | "support_opened_inbox"
  | "support_opened_ticket"
  | "support_opened_live_chat"
  | "support_opened_knowledge_base";

export type AdoptionChecklistItem = {
  action: AdoptionAction;
  label: string;
  description: string;
  href: string;
};

export type AdoptionTourStep = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

export type AdoptionExperience = {
  eyebrow: string;
  title: string;
  description: string;
  welcomeItems: string[];
  checklist: AdoptionChecklistItem[];
  tour: AdoptionTourStep[];
};

export type AdoptionState = {
  version: number;
  welcomeSeen: boolean;
  tourCompleted: boolean;
  tourSkipped: boolean;
  checklistEventSent: boolean;
  completedActions: AdoptionAction[];
  dismissedHints: string[];
};

export const EMPTY_ADOPTION_STATE: AdoptionState = {
  version: ADOPTION_VERSION,
  welcomeSeen: false,
  tourCompleted: false,
  tourSkipped: false,
  checklistEventSent: false,
  completedActions: [],
  dismissedHints: []
};

export const ADOPTION_EXPERIENCES: Record<AdoptionRole, AdoptionExperience> = {
  candidate: {
    eyebrow: "Candidate onboarding",
    title: "Welcome to MXVL",
    description: "Build a profile employers can understand, then use matching and preparation tools to move with confidence.",
    welcomeItems: [
      "Complete your candidate profile",
      "Upload your latest resume",
      "Explore relevant jobs",
      "Use AI recommendations as guidance"
    ],
    checklist: [
      { action: "candidate_profile_completed", label: "Complete profile", description: "Add the details employers need to assess your experience.", href: "/candidate?view=profile" },
      { action: "candidate_resume_uploaded", label: "Upload resume", description: "Unlock resume analysis and stronger job matching.", href: "/candidate?view=resume" },
      { action: "candidate_experience_added", label: "Add experience", description: "Show the work that best represents your strengths.", href: "/candidate?view=profile" },
      { action: "candidate_first_application", label: "Apply for your first job", description: "Start tracking an opportunity from your workspace.", href: "/jobs" }
    ],
    tour: [
      { title: "Your candidate workspace", description: "Your applications, profile, resume, and interview tools stay together in the candidate dashboard.", href: "/candidate", actionLabel: "Open dashboard" },
      { title: "Build a complete profile", description: "A clear profile gives employers better evidence and improves the quality of match guidance.", href: "/candidate?view=profile", actionLabel: "View profile" },
      { title: "Explore matching jobs", description: "Review the reasons behind a match, then decide which opportunities fit your goals.", href: "/jobs", actionLabel: "Browse jobs" },
      { title: "Prepare for interviews", description: "Use job-specific questions and readiness guidance before speaking with an employer.", href: "/candidate/interview-prep", actionLabel: "Open interview prep" }
    ]
  },
  employer: {
    eyebrow: "Employer onboarding",
    title: "Welcome to MXVL",
    description: "Set up your company, publish a clear role, and keep every candidate decision visible to your team.",
    welcomeItems: [
      "Complete your company profile",
      "Post or import your first job",
      "Review AI-ranked candidates",
      "Build a reusable talent pipeline"
    ],
    checklist: [
      { action: "employer_profile_completed", label: "Complete company profile", description: "Help candidates understand your company and hiring context.", href: "/employer#profile" },
      { action: "employer_first_job", label: "Create your first job", description: "Publish a role or import an existing job description.", href: "/employer" },
      { action: "employer_reviewed_applicants", label: "Review applicants", description: "Compare candidate evidence and match explanations.", href: "/employer/candidates" },
      { action: "employer_invited_candidate", label: "Invite a candidate", description: "Move a promising candidate into an active conversation.", href: "/employer/candidates" }
    ],
    tour: [
      { title: "Your hiring command center", description: "Jobs, applications, subscriptions, and pipeline activity are summarized in one workspace.", href: "/employer", actionLabel: "Open dashboard" },
      { title: "Create or import a role", description: "Post from scratch or turn an existing job description into a structured draft.", href: "/dashboard/employer/jobs/import", actionLabel: "Open job importer" },
      { title: "Review explainable matches", description: "Use ranked evidence to prioritize review while keeping every decision with your hiring team.", href: "/employer/candidates", actionLabel: "Review candidates" },
      { title: "Build long-term relationships", description: "Organize promising people into talent pools for future opportunities.", href: "/employer/talent-crm", actionLabel: "Open Talent CRM" }
    ]
  },
  admin: {
    eyebrow: "Admin onboarding",
    title: "Welcome to the MXVL admin workspace",
    description: "Monitor platform activity, handle account operations, and move into detailed records only when action is needed.",
    welcomeItems: [
      "Review platform health",
      "Manage users and roles",
      "Monitor jobs and employers",
      "Open support operations"
    ],
    checklist: [
      { action: "admin_reviewed_users", label: "Review users", description: "Confirm account roles and recent registrations.", href: "/admin/users" },
      { action: "admin_reviewed_employers", label: "Review employers", description: "Check company status and subscription context.", href: "/admin/employers" },
      { action: "admin_reviewed_jobs", label: "Review jobs", description: "Inspect published roles and visibility status.", href: "/admin/jobs" },
      { action: "admin_opened_support", label: "Open support center", description: "Review tickets and live-chat operations.", href: "/admin/support" }
    ],
    tour: [
      { title: "Start with the command center", description: "Dashboard widgets provide the first operational view without blocking the rest of the admin workspace.", href: "/admin", actionLabel: "Open dashboard" },
      { title: "Manage people and companies", description: "User, candidate, and employer sections keep identity and account actions separated.", href: "/admin/users", actionLabel: "Review users" },
      { title: "Review hiring activity", description: "Use the jobs section to inspect roles without changing employer workflows.", href: "/admin/jobs", actionLabel: "Review jobs" },
      { title: "Coordinate support", description: "Tickets and live chat remain available through the support center.", href: "/admin/support", actionLabel: "Open support" }
    ]
  },
  support: {
    eyebrow: "Support onboarding",
    title: "Welcome to MXVL Support",
    description: "Triage requests, understand customer context, and keep every handoff clear and accountable.",
    welcomeItems: [
      "Review the unified inbox",
      "Open a support ticket",
      "Monitor the live-chat queue",
      "Use internal feature guides"
    ],
    checklist: [
      { action: "support_opened_inbox", label: "Open the inbox", description: "Review requests that need the next response.", href: "/support/inbox" },
      { action: "support_opened_ticket", label: "Review a ticket", description: "See customer context, messages, and status history.", href: "/support/tickets" },
      { action: "support_opened_live_chat", label: "Open live chat", description: "Monitor waiting and active chat sessions.", href: "/support/live-chat" },
      { action: "support_opened_knowledge_base", label: "Review feature guides", description: "Use internal guidance before escalating an issue.", href: "/support/knowledge-base" }
    ],
    tour: [
      { title: "Your support dashboard", description: "Start with queue health, response targets, and requests that need attention.", href: "/support", actionLabel: "Open dashboard" },
      { title: "Work from the inbox", description: "The inbox brings ticket and chat-created work into one operational queue.", href: "/support/inbox", actionLabel: "Open inbox" },
      { title: "Respond in the right channel", description: "Ticket history and live chat stay separate so the active workflow remains clear.", href: "/support/tickets", actionLabel: "Review tickets" },
      { title: "Use internal guidance", description: "Feature and process guides help resolve common issues without interrupting the customer.", href: "/support/knowledge-base", actionLabel: "Open guides" }
    ]
  }
};

export function normalizeAdoptionRole(role?: string | null): AdoptionRole | null {
  if (role === "candidate" || role === "employer" || role === "admin") return role;
  if (role === "employee" || role === "support_agent" || role === "support_senior" || role === "support_manager") return "support";
  return null;
}

export function getAdoptionStorageKey(userId: string, role: AdoptionRole) {
  return `${ADOPTION_STORAGE_PREFIX}:${ADOPTION_VERSION}:${userId}:${role}`;
}

export function calculateChecklistProgress(items: AdoptionChecklistItem[], completedActions: AdoptionAction[]) {
  const completed = items.filter((item) => completedActions.includes(item.action)).length;
  return {
    completed,
    total: items.length,
    percentage: items.length ? Math.round((completed / items.length) * 100) : 0
  };
}

export function emitAdoptionAction(action: AdoptionAction) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AdoptionAction>(ADOPTION_ACTION_EVENT, { detail: action }));
}
