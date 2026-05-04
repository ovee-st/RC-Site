import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const validStages = ["applied", "shortlisted", "interview", "offer", "hired"];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const applicationId = body.application_id;
  const newStatus = String(body.new_status || "").toLowerCase();

  if (!applicationId || !validStages.includes(newStatus)) {
    return NextResponse.json({ error: "application_id and valid new_status are required." }, { status: 400 });
  }

  try {
    const supabase = createServerSupabaseClient();
    const timestampColumn = `${newStatus}_at`;
    const payload: Record<string, string> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus !== "applied") payload[timestampColumn] = new Date().toISOString();

    const { data, error } = await supabase.from("applications").update(payload).eq("id", applicationId).select("*").single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({
      id: applicationId,
      status: newStatus,
      updated_at: new Date().toISOString(),
      warning: error instanceof Error ? error.message : "Supabase not configured; returned optimistic response."
    });
  }
}
