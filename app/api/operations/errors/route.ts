import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const globalRate = globalThis as typeof globalThis & { __operationsErrorRates?: Map<string, { count: number; resetAt: number }> };
const rates = globalRate.__operationsErrorRates ||= new Map();

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
      .replace(/[A-Za-z0-9+/]{500,}={0,2}/g, "[redacted]")
      .trim()
      .slice(0, max)
    : "";
}

function allowed(ip: string) {
  const now = Date.now();
  const current = rates.get(ip);
  const next = !current || current.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { ...current, count: current.count + 1 };
  rates.set(ip, next);
  if (rates.size > 2_000) for (const [key, value] of rates) if (value.resetAt <= now) rates.delete(key);
  return next.count <= 30;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowed(ip)) return NextResponse.json({ ok: true, captured: false }, { status: 202 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const message = clean(body.message, 1000);
  if (!message) return NextResponse.json({ error: "Error message is required." }, { status: 400 });
  const route = clean(body.route, 500);
  const source = clean(body.source, 30) || "client";
  const correlationId = clean(body.correlation_id, 100) || crypto.randomUUID();
  const fingerprint = createHash("sha256").update(`${source}:${route}:${message}`).digest("hex").slice(0, 32);

  try {
    const client = createServerSupabaseClient();
    const result = await client.from("platform_errors").insert({
      source: ["client", "server", "api", "background_job", "ai", "database"].includes(source) ? source : "client",
      severity: clean(body.severity, 20) || "error",
      error_code: clean(body.error_code, 80) || null,
      message,
      route: route || null,
      correlation_id: correlationId,
      fingerprint,
      context: {
        user_agent: clean(request.headers.get("user-agent"), 300),
        stack: clean(body.stack, 2000)
      }
    });
    if (result.error) {
      if (/does not exist|schema cache/i.test(result.error.message)) return NextResponse.json({ ok: true, captured: false, correlationId }, { status: 202 });
      throw new Error(result.error.message);
    }
    return NextResponse.json({ ok: true, captured: true, correlationId }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: true, captured: false, correlationId }, { status: 202 });
  }
}
