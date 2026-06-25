import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  createProfileUsername,
  ensureRoleRecord,
  getAuthDisplayName,
  normalizePlatformRole
} from "@/lib/authUserSync";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Missing session token." }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));

    const adminClient = createServerSupabaseClient();
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const authUser = authData.user;
    const metadata = authUser.user_metadata || {};
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    const role =
      normalizePlatformRole(existingProfile?.role) ||
      normalizePlatformRole(metadata.role) ||
      normalizePlatformRole(body.selected_role || body.selectedRole || body.role) ||
      "candidate";
    const fullName = existingProfile?.full_name || existingProfile?.name || getAuthDisplayName(authUser);
    const username = existingProfile?.username || metadata.username || createProfileUsername(role, authUser.email, fullName, authUser.id);

    const profilePayload = {
      id: authUser.id,
      email: authUser.email || existingProfile?.email || "",
      full_name: fullName,
      name: fullName,
      role,
      username,
      avatar_url: existingProfile?.avatar_url || metadata.avatar_url || metadata.picture || null,
      photo_url: existingProfile?.photo_url || metadata.photo_url || metadata.picture || null,
      plan: existingProfile?.plan || metadata.plan || (role === "admin" || role === "viewer" || role === "employee" ? "Internal" : "Basic"),
      verified: existingProfile?.verified ?? metadata.verified ?? false,
      updated_at: new Date().toISOString()
    };

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    await ensureRoleRecord(adminClient, profile || profilePayload);

    return NextResponse.json({ ok: true, profile: profile || profilePayload });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not ensure profile." }, { status: 500 });
  }
}
