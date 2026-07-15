import { NextResponse } from "next/server";

type AnalyticsValue = string | number | boolean | null;
type AnalyticsParameters = Record<string, AnalyticsValue>;

const FORBIDDEN_PARAMETER_PATTERN = /(password|email|phone|token|jwt|cookie|authorization|secret|credential|session)/i;
const EVENT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,39}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(error: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(details || {}) }, { status });
}

function stringOrUndefined(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function sanitizeParameters(value: unknown): AnalyticsParameters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>).reduce<AnalyticsParameters>((params, [key, rawValue]) => {
    if (!key || FORBIDDEN_PARAMETER_PATTERN.test(key)) return params;
    if (rawValue === null || typeof rawValue === "string" || typeof rawValue === "number" || typeof rawValue === "boolean") {
      params[key.slice(0, 40)] = typeof rawValue === "string" ? rawValue.slice(0, 500) : rawValue;
    }
    return params;
  }, {});
}

function getClientId(sessionId?: string, userId?: string) {
  return sessionId || userId || crypto.randomUUID();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return jsonError("Invalid JSON body.", 400);
  }

  const eventName = stringOrUndefined((body as { event_name?: unknown }).event_name, 40);
  if (!eventName || !EVENT_NAME_PATTERN.test(eventName)) {
    return jsonError("A valid event_name is required.", 400);
  }

  const pageLocation = stringOrUndefined((body as { page_location?: unknown }).page_location, 1_000);
  const pageTitle = stringOrUndefined((body as { page_title?: unknown }).page_title, 300);
  const userId = stringOrUndefined((body as { user_id?: unknown }).user_id, 80);
  const sessionId = stringOrUndefined((body as { session_id?: unknown }).session_id, 120);

  if (userId && !UUID_PATTERN.test(userId)) {
    return jsonError("user_id must be a Supabase user UUID when provided.", 400);
  }

  const measurementId = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  const serverTimestampMicros = Date.now() * 1000;
  const parameters = sanitizeParameters((body as { parameters?: unknown }).parameters);

  const payload = {
    client_id: getClientId(sessionId, userId),
    ...(userId ? { user_id: userId } : {}),
    timestamp_micros: serverTimestampMicros,
    events: [
      {
        name: eventName,
        params: {
          ...(pageLocation ? { page_location: pageLocation } : {}),
          ...(pageTitle ? { page_title: pageTitle } : {}),
          ...parameters
        }
      }
    ]
  };

  if (!measurementId || !apiSecret) {
    return NextResponse.json({ ok: true, forwarded: false, reason: "GA4 Measurement Protocol is not configured." }, { status: 202 });
  }

  try {
    const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return NextResponse.json({ ok: true, forwarded: false, status: response.status }, { status: 202 });
    }

    return NextResponse.json({ ok: true, forwarded: true });
  } catch {
    return NextResponse.json({ ok: true, forwarded: false }, { status: 202 });
  }
}
