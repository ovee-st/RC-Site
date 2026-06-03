import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { buildMobileSession, createPublicAuthClient, normalizeMobileRole } from "../session";
import { createProfileUsername } from "@/lib/authUserSync";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const fullName = String(body.fullName || body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = normalizeMobileRole(body.role);

    if (!fullName || !email || !password) {
      return NextResponse.json({ data: null, error: "Name, email, and password are required." });
    }

    if (!["candidate", "employer"].includes(role)) {
      return NextResponse.json({ data: null, error: "Mobile registration supports candidate and employer accounts." });
    }

    const adminClient = createServerSupabaseClient();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        name: fullName,
        role,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json({ data: null, error: createError?.message || "Unable to create account." });
    }

    const username = createProfileUsername(role, email, fullName, created.user.id);
    await adminClient.from("profiles").upsert(
      {
        id: created.user.id,
        email,
        full_name: fullName,
        name: fullName,
        role,
        username,
        plan: "Basic",
        verified: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    const authClient = createPublicAuthClient();
    const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password });

    if (signInError || !signedIn.user || !signedIn.session) {
      return NextResponse.json({ data: null, error: signInError?.message || "Account created, but login failed." });
    }

    const mobileSession = await buildMobileSession({ adminClient, authUser: signedIn.user, authSession: signedIn.session, preferredRole: role });
    return NextResponse.json({ data: mobileSession, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to register.";
    return NextResponse.json({ data: null, error: message }, { status: 200 });
  }
}
