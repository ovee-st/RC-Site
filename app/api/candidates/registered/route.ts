import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { mergeRowsWithProfiles, normalizePlatformRole, syncAuthUsersToProfiles } from "@/lib/authUserSync";

const ALLOWED_ROLES = new Set(["admin", "viewer", "employer", "employee"]);

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Missing session token." }, { status: 401 });
    }

    const adminClient = createServerSupabaseClient();
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const { data: requester } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();

    const requesterRole = normalizePlatformRole(requester?.role || authData.user.user_metadata?.role);
    if (!ALLOWED_ROLES.has(String(requesterRole || ""))) {
      return NextResponse.json({ error: "You are not allowed to browse registered candidates." }, { status: 403 });
    }

    const syncResult = requesterRole === "admin" || requesterRole === "viewer"
      ? await syncAuthUsersToProfiles(adminClient)
      : { profiles: [] };

    const [candidateRows, profileRows] = await Promise.all([
      adminClient.from("candidates").select("*").limit(1000),
      adminClient.from("profiles").select("*").eq("role", "candidate").limit(1000)
    ]);

    const profiles = profileRows.data?.length ? profileRows.data : syncResult.profiles;

    return NextResponse.json({
      ok: true,
      candidates: mergeRowsWithProfiles(candidateRows.data || [], profiles || [], "candidate")
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load candidates." }, { status: 500 });
  }
}
