import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const EVENT_TYPES = new Set(["view", "job_view", "apply_click", "application_started", "application_completed"]);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!/^[0-9a-f-]{36}$/i.test(body.career_page_id || "") || !EVENT_TYPES.has(body.event_type)) return NextResponse.json({ error: "Invalid career page event." }, { status: 400 });
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
    const sessionHash = createHash("sha256").update(`${forwarded}:${request.headers.get("user-agent") || ""}:${new Date().toISOString().slice(0, 10)}`).digest("hex").slice(0, 32);
    const client = createServerSupabaseClient();
    const result = await client.from("career_page_events").insert({ career_page_id: body.career_page_id, event_type: body.event_type, job_id: /^[0-9a-f-]{36}$/i.test(body.job_id || "") ? body.job_id : null, source: String(body.source || "direct").slice(0, 100), session_hash: sessionHash });
    if (result.error) throw new Error(result.error.message); return NextResponse.json({ recorded: true }, { status: 201 });
  } catch (error) { console.error("[career-page-event] failed", error); return NextResponse.json({ recorded: false }, { status: 202 }); }
}
