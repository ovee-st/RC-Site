import { DEFAULT_PIPELINE_STAGE_NAMES, type OfferStatus } from "@/types/ats";

const stageColorByName: Record<string, string> = {
  Applied: "#2563eb",
  "AI Reviewed": "#0891b2",
  Shortlisted: "#7c3aed",
  "Phone Screening": "#4f46e5",
  Assessment: "#d97706",
  Interview: "#ea580c",
  "Final Interview": "#db2777",
  "Reference Check": "#0d9488",
  Offer: "#16a34a",
  Hired: "#15803d",
  Rejected: "#dc2626",
  Archived: "#64748b"
};

const terminalStages = new Set(["Hired", "Rejected", "Archived"]);

export function slugifyStage(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function createDefaultStageRows(pipelineId: string) {
  return DEFAULT_PIPELINE_STAGE_NAMES.map((name, index) => ({
    pipeline_id: pipelineId,
    name,
    slug: slugifyStage(name),
    position: index,
    color: stageColorByName[name] || "#2563eb",
    is_terminal: terminalStages.has(name),
    is_archived: false
  }));
}

export function legacyStatusToStage(status?: string | null) {
  const normalized = String(status || "").trim().toLowerCase().replace(/[_-]+/g, " ");
  if (!normalized || normalized === "applied" || normalized === "submitted") return "Applied";
  if (normalized.includes("ai")) return "AI Reviewed";
  if (normalized.includes("shortlist") || normalized === "under review") return "Shortlisted";
  if (normalized.includes("phone")) return "Phone Screening";
  if (normalized.includes("assessment") || normalized.includes("test")) return "Assessment";
  if (normalized.includes("final interview")) return "Final Interview";
  if (normalized.includes("interview")) return "Interview";
  if (normalized.includes("reference")) return "Reference Check";
  if (normalized.includes("offer")) return "Offer";
  if (normalized.includes("hire")) return "Hired";
  if (normalized.includes("reject") || normalized.includes("decline")) return "Rejected";
  if (normalized.includes("archiv")) return "Archived";
  return "Applied";
}

export function validateStageMove(input: {
  currentStageId?: string | null;
  targetStageId: string;
  targetArchived: boolean;
  currentTerminal?: boolean;
  actorRole: string;
}) {
  if (!input.targetStageId) return { allowed: false, reason: "A destination stage is required." };
  if (input.targetArchived) return { allowed: false, reason: "Candidates cannot be moved into an archived stage." };
  if (input.currentStageId === input.targetStageId) return { allowed: false, reason: "Candidate is already in this stage." };
  if (input.currentTerminal && input.actorRole !== "admin") {
    return { allowed: false, reason: "Only an administrator can reopen a terminal application." };
  }
  return { allowed: true, reason: null };
}

const offerTransitions: Record<OfferStatus, OfferStatus[]> = {
  draft: ["internal_approval", "sent", "withdrawn"],
  internal_approval: ["draft", "sent", "withdrawn"],
  sent: ["viewed", "accepted", "declined", "expired", "withdrawn"],
  viewed: ["accepted", "declined", "expired", "withdrawn"],
  accepted: [],
  declined: [],
  expired: [],
  withdrawn: []
};

export function validateOfferTransition(current: OfferStatus, target: OfferStatus) {
  if (current === target) return { allowed: true, reason: null };
  const allowed = offerTransitions[current]?.includes(target) || false;
  return { allowed, reason: allowed ? null : `Offer cannot move from ${current} to ${target}.` };
}

export function isTaskOverdue(status: string, dueAt?: string | null, now = new Date()) {
  if (status === "completed" || !dueAt) return false;
  const due = new Date(dueAt);
  return Number.isFinite(due.getTime()) && due < now;
}

export function canDeleteStage(activeCandidateCount: number) {
  return activeCandidateCount === 0
    ? { allowed: true, reason: null }
    : { allowed: false, reason: "Move active candidates before deleting this stage." };
}

export type AtsPermission = "pipeline" | "tasks" | "interviews" | "offers";

export function canPerformAtsAction(role: string, permission: AtsPermission, write: boolean, permissions?: Record<string, unknown> | null) {
  if (role === "admin" || role === "employer") return true;
  if (role === "viewer") return !write;
  if (permissions && permissions[permission] === false) return false;
  if (role === "interviewer") return permission === "interviews";
  if (role === "hiring_manager") return permission !== "offers" || permissions?.offers === true;
  if (role === "recruiter" || role === "employee") return permission !== "offers" || permissions?.offers === true;
  return false;
}

export function applyOptimisticStageMove<T extends { applicationId: string; stageId: string; stageName: string }>(items: T[], applicationIds: string[], stageId: string, stageName: string) {
  const selected = new Set(applicationIds);
  return items.map((item) => selected.has(item.applicationId) ? { ...item, stageId, stageName } : item);
}
