import "server-only";
import { randomUUID } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { logger } from "@/lib/observability/logger";

export type BackgroundJobStatus = "queued" | "running" | "completed" | "retrying" | "dead_letter" | "cancelled";
export type BackgroundJob<T = Record<string, unknown>> = { id: string; type: string; payload: T; status: BackgroundJobStatus; attempts: number; maxAttempts: number; progress: number; scheduledAt: string };

export async function enqueueBackgroundJob<T extends Record<string, unknown>>(type: string, payload: T, options: { maxAttempts?: number; delayMs?: number; correlationId?: string } = {}): Promise<BackgroundJob<T>> {
  const row = { id: randomUUID(), job_type: type.slice(0, 100), payload, status: "queued", attempts: 0, max_attempts: Math.max(1, Math.min(10, options.maxAttempts || 3)), progress: 0, scheduled_at: new Date(Date.now() + Math.max(0, options.delayMs || 0)).toISOString(), correlation_id: options.correlationId || null };
  const client = createServerSupabaseClient(); const result = await client.from("platform_background_jobs").insert(row).select("id,job_type,payload,status,attempts,max_attempts,progress,scheduled_at").single();
  if (result.error) throw new Error(result.error.message);
  logger.info("background_job_queued", { jobId: row.id, type: row.job_type, correlationId: options.correlationId });
  return { id: result.data.id, type: result.data.job_type, payload: result.data.payload as T, status: result.data.status, attempts: result.data.attempts, maxAttempts: result.data.max_attempts, progress: result.data.progress, scheduledAt: result.data.scheduled_at };
}

export function nextJobState(attempts: number, maxAttempts: number, succeeded: boolean): BackgroundJobStatus {
  if (succeeded) return "completed";
  return attempts >= maxAttempts ? "dead_letter" : "retrying";
}

export function retryDelayMs(attempt: number, baseMs = 1_000) {
  return Math.min(15 * 60_000, baseMs * 2 ** Math.max(0, attempt - 1));
}
