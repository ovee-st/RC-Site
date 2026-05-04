import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { user_id, type, title, message } = body;
  if (!user_id || !type || !title || !message) return NextResponse.json({ error: "Missing notification fields." }, { status: 400 });

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.from("notifications").insert({ user_id, type, title, message, is_read: false }).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ id: crypto.randomUUID(), user_id, type, title, message, is_read: false, warning: error instanceof Error ? error.message : "Supabase not configured." });
  }
}
