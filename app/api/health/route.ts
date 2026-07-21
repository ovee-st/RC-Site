import { performance } from "node:perf_hooks";
import { apiSuccess, getCorrelationId } from "@/lib/api/errors";
import { validateEnvironment } from "@/lib/config";
import { getFeatureFlags } from "@/lib/featureFlags";
import { logger } from "@/lib/observability/logger";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Check = { status: "healthy" | "degraded" | "unhealthy"; latencyMs: number; message?: string };

async function timed(check: () => Promise<void>): Promise<Check> {
  const started = performance.now();
  try { await Promise.race([check(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Health check timed out")), 4_000))]); return { status: "healthy", latencyMs: Math.round(performance.now() - started) }; }
  catch (error) {
    const message = process.env.NODE_ENV === "production" ? "Dependency check failed" : error instanceof Error ? error.message.slice(0, 160) : "Dependency check failed";
    return { status: "unhealthy", latencyMs: Math.round(performance.now() - started), message };
  }
}

export async function GET(request: Request) {
  const correlationId = getCorrelationId(request);
  const config = validateEnvironment();
  let database: Check = { status: "unhealthy", latencyMs: 0, message: "Server configuration unavailable" };
  let storage: Check = database;
  let authentication: Check = database;
  if (config.valid) {
    const client = createServerSupabaseClient();
    [database, storage, authentication] = await Promise.all([
      timed(async () => { const result = await client.from("profiles").select("id", { head: true, count: "exact" }).limit(1); if (result.error) throw new Error(result.error.message); }),
      timed(async () => { const result = await client.storage.listBuckets(); if (result.error) throw new Error(result.error.message); }),
      timed(async () => { const result = await client.auth.admin.listUsers({ page: 1, perPage: 1 }); if (result.error) throw new Error(result.error.message); })
    ]);
  }
  const ai: Check = process.env.OPENAI_API_KEY ? { status: "healthy", latencyMs: 0, message: "Provider configured; network call omitted from liveness probe" } : { status: "degraded", latencyMs: 0, message: "Deterministic fallbacks active" };
  const checks = { database, storage, authentication, environment: { status: config.valid ? "healthy" : "unhealthy", latencyMs: 0, message: config.valid ? config.warnings.join(" ") || undefined : `Missing: ${config.missing.join(", ")}` } as Check, ai };
  const unhealthy = Object.values(checks).some((check) => check.status === "unhealthy");
  const degraded = Object.values(checks).some((check) => check.status === "degraded");
  const status = unhealthy ? "unhealthy" : degraded ? "degraded" : "healthy";
  if (unhealthy) logger.error("health_check_failed", { correlationId, checks });
  return apiSuccess({ status, timestamp: new Date().toISOString(), correlationId, checks, features: getFeatureFlags(), version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local" }, request, { status: unhealthy ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
