import { NextResponse } from "next/server";
import { normalizePlatformRole } from "@/lib/authUserSync";
import { validateCandidateProfileAccessPolicy } from "@/lib/candidateProfileAccessPolicy";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SubscriptionService } from "@/lib/subscriptionService";

function normalizeCandidateProfile(candidate: Record<string, any>, profile: Record<string, any> | null) {
  return {
    ...candidate,
    profile: profile
      ? {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url || profile.photo_url || profile.profile_photo_url || null,
        verified: Boolean(profile.verified)
      }
      : null
  };
}

async function loadCandidateProfile(adminClient: ReturnType<typeof createServerSupabaseClient>, candidateId: string) {
  const byCandidateId = await adminClient
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();

  const byUserId = byCandidateId.data
    ? { data: null, error: null }
    : await adminClient
      .from("candidates")
      .select("*")
      .eq("user_id", candidateId)
      .maybeSingle();

  const candidate = byCandidateId.data || byUserId.data;
  const error = byCandidateId.error || byUserId.error;

  if (error || !candidate) {
    return { candidate: null, profile: null, error };
  }

  const userId = candidate.user_id || candidate.id;
  const { data: profile } = userId
    ? await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
    : { data: null };

  return { candidate, profile: profile || null, error: null };
}

export async function GET(request: Request, context: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await context.params;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "unauthenticated", message: "Missing session token." }, { status: 401 });
  }

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json({ error: "unauthenticated", message: "Invalid session." }, { status: 401 });
  }

  const { data: requester } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const requesterRole = String(normalizePlatformRole(requester?.role || authData.user.user_metadata?.role) || "");
  const subscriptionService = new SubscriptionService(adminClient);
  const policy = await validateCandidateProfileAccessPolicy(adminClient, subscriptionService, authData.user.id, requesterRole);

  if (!policy.allowed) {
    return NextResponse.json(policy.body, { status: policy.status });
  }

  const { candidate, profile, error } = await loadCandidateProfile(adminClient, candidateId);

  if (error || !candidate) {
    return NextResponse.json({ error: "candidate_not_found", message: "Candidate profile not found." }, { status: 404 });
  }

  let tracking: Awaited<ReturnType<SubscriptionService["recordCandidateView"]>> | null = null;

  if (policy.shouldTrackUsage && policy.employer) {
    tracking = await subscriptionService.recordCandidateView(policy.employer.id);

    if (!tracking.recorded) {
      return NextResponse.json(
        {
          error: "subscription_limit_reached",
          message: tracking.access.reason || "Candidate profile view limit reached for the current subscription period.",
          usage: tracking.access
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    candidate: normalizeCandidateProfile(candidate, profile),
    subscription: tracking
      ? {
        usage: tracking.usage,
        access: tracking.access,
        recorded: tracking.recorded
      }
      : null
  });
}
