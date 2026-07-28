export const OPERATIONS_PAGE_SIZE = 25;
export const OPERATIONS_MAX_PAGE_SIZE = 100;

export const PRODUCT_EVENT_NAMES = [
  "first_login",
  "profile_completed",
  "resume_upload",
  "job_post_created",
  "job_published",
  "job_application",
  "ai_job_import_used",
  "resume_ai_used",
  "talent_crm_used",
  "interview_pack_generated",
  "pipeline_moved",
  "offer_accepted",
  "feedback_submitted"
] as const;

export type OperationsView =
  | "overview"
  | "analytics"
  | "beta"
  | "support"
  | "health"
  | "ai"
  | "audit"
  | "users"
  | "errors"
  | "notifications"
  | "releases"
  | "feedback";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export type OperationsMetric = {
  key: string;
  label: string;
  value: number;
  detail?: string;
};

export type FunnelStep = {
  event: string;
  label: string;
  users: number;
  conversion: number;
  dropOff: number;
};

export type ProductEventRow = {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  event_name: string;
  page_path: string | null;
  role: string | null;
  session_id: string | null;
  duration_ms: number | null;
  completed: boolean | null;
  properties: Record<string, unknown>;
  occurred_at: string;
};

export function clampPageSize(value: number) {
  if (!Number.isFinite(value)) return OPERATIONS_PAGE_SIZE;
  return Math.min(OPERATIONS_MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

export function uniqueActiveUsers(events: Array<Pick<ProductEventRow, "user_id" | "anonymous_id">>) {
  return new Set(
    events
      .map((event) => event.user_id || event.anonymous_id)
      .filter((identity): identity is string => Boolean(identity))
  ).size;
}

export function buildFunnel(
  events: Array<Pick<ProductEventRow, "event_name" | "user_id" | "anonymous_id">>,
  steps: Array<{ event: string; label: string }>
): FunnelStep[] {
  const counts = steps.map((step) => {
    const users = new Set(
      events
        .filter((event) => event.event_name === step.event)
        .map((event) => event.user_id || event.anonymous_id)
        .filter((identity): identity is string => Boolean(identity))
    ).size;
    return { ...step, users };
  });
  const initial = counts[0]?.users || 0;

  return counts.map((step, index) => {
    const previous = index === 0 ? initial : counts[index - 1].users;
    return {
      ...step,
      conversion: initial ? Math.round((step.users / initial) * 100) : 0,
      dropOff: previous ? Math.max(0, Math.round(((previous - step.users) / previous) * 100)) : 0
    };
  });
}

export function aggregateFeatureAdoption(events: Array<Pick<ProductEventRow, "event_name" | "user_id" | "anonymous_id" | "duration_ms" | "completed">>) {
  const grouped = new Map<string, { users: Set<string>; events: number; completed: number; durationTotal: number; durationSamples: number }>();
  for (const event of events) {
    const current = grouped.get(event.event_name) || { users: new Set<string>(), events: 0, completed: 0, durationTotal: 0, durationSamples: 0 };
    const identity = event.user_id || event.anonymous_id;
    if (identity) current.users.add(identity);
    current.events += 1;
    if (event.completed) current.completed += 1;
    if (typeof event.duration_ms === "number" && event.duration_ms >= 0) {
      current.durationTotal += event.duration_ms;
      current.durationSamples += 1;
    }
    grouped.set(event.event_name, current);
  }

  return [...grouped.entries()]
    .map(([event, value]) => ({
      event,
      users: value.users.size,
      events: value.events,
      completionRate: value.events ? Math.round((value.completed / value.events) * 100) : 0,
      averageDurationMs: value.durationSamples ? Math.round(value.durationTotal / value.durationSamples) : null
    }))
    .sort((left, right) => right.events - left.events);
}

export function categorizeFeedback(message: string, requestedType = "general") {
  const normalized = message.toLowerCase();
  if (requestedType !== "general") return requestedType;
  if (/(bug|broken|error|failed|cannot|can't|issue)/.test(normalized)) return "bug";
  if (/(feature|request|would like|please add)/.test(normalized)) return "feature_request";
  if (/(idea|suggest|could you|improve)/.test(normalized)) return "idea";
  return "general";
}
