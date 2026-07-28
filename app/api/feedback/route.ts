import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { categorizeFeedback } from "@/lib/operationsIntelligence";

const TYPES = new Set(["idea", "bug", "feature_request", "general", "satisfaction", "suggestion"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const message = clean(body.message, 3000);
  const requestedType = clean(body.feedback_type, 40).replace("suggestion", "idea") || "general";
  if (message.length < 10) return NextResponse.json({ error: "Feedback must contain at least 10 characters." }, { status: 400 });
  if (!TYPES.has(clean(body.feedback_type, 40) || "general")) return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });

  try {
    const client = createServerSupabaseClient();
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const user = token ? (await client.auth.getUser(token)).data.user : null;
    const result = await client.from("feedback_hub").insert({
      user_id: user?.id || null,
      feedback_type: categorizeFeedback(message, requestedType),
      rating: Number.isFinite(Number(body.rating)) ? Math.max(1, Math.min(5, Number(body.rating))) : null,
      title: clean(body.title, 180) || null,
      message,
      page_path: clean(body.page_path, 500) || null,
      role: clean(body.role, 40) || null,
      metadata: { source: "beta_feedback_widget" }
    }).select("id,status,created_at").single();
    if (result.error) {
      if (/does not exist|schema cache/i.test(result.error.message)) return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
      throw new Error(result.error.message);
    }
    return NextResponse.json({ ok: true, persisted: true, record: result.data }, { status: 201 });
  } catch (error) {
    console.error("[feedback-hub] submission failed", error);
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 });
  }
}
