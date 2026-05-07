import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.name || !body?.email || !body?.message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }

  const payload = {
    name: String(body.name),
    email: String(body.email),
    company: body.company ? String(body.company) : null,
    phone: body.phone ? String(body.phone) : null,
    message: String(body.message),
    status: "new"
  };

  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, request: payload });
  }

  const { error } = await supabase.from("contact_requests").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
