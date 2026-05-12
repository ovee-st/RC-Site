import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  ensureRoleRecord,
  mergeRowsWithProfiles,
  normalizePlatformRole,
  syncAuthUsersToProfiles
} from "@/lib/authUserSync";

const ADMIN_ROLES = new Set(["admin", "viewer"]);

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Missing admin session token." }, { status: 401 });
    }

    const adminClient = createServerSupabaseClient();
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
    }

    const { data: requester } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!ADMIN_ROLES.has(String(requester?.role || ""))) {
      return NextResponse.json({ error: "Only admin users can sync registered users." }, { status: 403 });
    }

    const { profiles } = await syncAuthUsersToProfiles(adminClient);

    await Promise.all(
      profiles
        .filter((profile) => ["candidate", "employer"].includes(String(normalizePlatformRole(profile.role))))
        .map((profile) => ensureRoleRecord(adminClient, profile))
    );

    const [candidateRows, employerRows] = await Promise.all([
      adminClient.from("candidates").select("*").limit(1000),
      adminClient.from("employers").select("*").limit(1000)
    ]);

    return NextResponse.json({
      ok: true,
      synced: profiles.length,
      profiles,
      candidates: mergeRowsWithProfiles(candidateRows.data || [], profiles, "candidate"),
      employers: mergeRowsWithProfiles(employerRows.data || [], profiles, "employer")
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not sync registered users." }, { status: 500 });
  }
}
