import type { TimelineEvent } from "@/lib/ai/candidates/types";
export function timelineEvent(event: TimelineEvent["event"], actorType: TimelineEvent["actorType"], metadata: Record<string, unknown> = {}): TimelineEvent { return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, event, timestamp: new Date().toISOString(), actorType, metadata }; }
export function sortTimeline(events: TimelineEvent[]) { return [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); }
