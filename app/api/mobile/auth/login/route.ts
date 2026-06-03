import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { buildMobileSession, createPublicAuthClient } from "../session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ data: null, error: "Email and password are required." });
    }

    const authClient = createPublicAuthClient();
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      return NextResponse.json({ data: null, error: error?.message || "Invalid email or password." });
    }

    const adminClient = createServerSupabaseClient();
    const mobileSession = await buildMobileSession({ adminClient, authUser: data.user, authSession: data.session });

    return NextResponse.json({ data: mobileSession, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login.";
    return NextResponse.json({ data: null, error: message }, { status: 200 });
  }
}
