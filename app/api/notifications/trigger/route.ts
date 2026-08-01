import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const notificationRates = new Map<string, { count: number; resetAt: number }>();
const ADMIN_ROLES = new Set(["admin", "support_manager"]);

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function withinRateLimit(userId: string) {
  const now = Date.now();
  const current = notificationRates.get(userId);
  const next = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + 60_000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  notificationRates.set(userId, next);
  if (notificationRates.size > 1_000) {
    for (const [key, entry] of notificationRates) if (entry.resetAt <= now) notificationRates.delete(key);
  }
  return next.count <= 30;
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });

  try {
    const client = createServerSupabaseClient();
    const auth = await client.auth.getUser(token);
    if (auth.error || !auth.data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    if (!withinRateLimit(auth.data.user.id)) return NextResponse.json({ error: "Too many notification requests." }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const userId = body.user_id;
    const type = cleanText(body.type, 80);
    const title = cleanText(body.title, 160);
    const message = cleanText(body.message, 2_000);
    if (!isUuid(userId) || !/^[a-z0-9_.-]{1,80}$/i.test(type) || !title || !message) {
      return NextResponse.json({ error: "Invalid notification fields." }, { status: 400 });
    }

    if (userId !== auth.data.user.id) {
      const profile = await client.from("profiles").select("role").eq("id", auth.data.user.id).maybeSingle();
      if (profile.error) throw profile.error;
      if (!ADMIN_ROLES.has(String(profile.data?.role || "").toLowerCase())) {
        return NextResponse.json({ error: "You cannot create notifications for another user." }, { status: 403 });
      }
    }

    const result = await client
      .from("notifications")
      .insert({ user_id: userId, type, title, message, is_read: false })
      .select("id,user_id,type,title,message,is_read,created_at")
      .single();
    if (result.error) throw result.error;
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("[notifications] create failed", error);
    return NextResponse.json({ error: "Could not create notification." }, { status: 500 });
  }
}
