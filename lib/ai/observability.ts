import "server-only";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { logger } from "@/lib/observability/logger";

export type AiMetric = { task: string; model: string; latencyMs: number; success: boolean; fallbackUsed: boolean; confidence?: number | null; promptVersion?: string; inputTokens?: number | null; outputTokens?: number | null; cacheHit?: boolean; humanOverride?: boolean; errorCode?: string | null; correlationId?: string | null };

export async function recordAiMetric(metric: AiMetric) {
  const row = { task: metric.task.slice(0, 120), model: metric.model.slice(0, 120), latency_ms: Math.max(0, Math.round(metric.latencyMs)), success: metric.success, fallback_used: metric.fallbackUsed, confidence: metric.confidence ?? null, prompt_version: metric.promptVersion || "v1", input_tokens: metric.inputTokens ?? null, output_tokens: metric.outputTokens ?? null, cache_hit: Boolean(metric.cacheHit), human_override: Boolean(metric.humanOverride), error_code: metric.errorCode || null, correlation_id: metric.correlationId || null };
  try { const client = createServerSupabaseClient(); const result = await client.from("ai_observability_events").insert(row); if (result.error && !/does not exist|schema cache/i.test(result.error.message)) throw new Error(result.error.message); }
  catch (error) { logger.warn("ai_metric_write_failed", { task: metric.task, error }); }
}
