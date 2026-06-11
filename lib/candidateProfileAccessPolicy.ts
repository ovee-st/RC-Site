import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionService } from "@/lib/subscriptionService";

const INTERNAL_CANDIDATE_ACCESS_ROLES = new Set(["admin", "viewer", "employee", "support_agent", "support_senior", "support_manager"]);

export type CandidateProfileAccessPolicyResult =
  | {
      allowed: true;
      shouldTrackUsage: boolean;
      employer: {
        id: string;
        userId: string;
      } | null;
      usage: Awaited<ReturnType<SubscriptionService["canViewCandidate"]>> | null;
    }
  | {
      allowed: false;
      status: number;
      body: {
        error: "subscription_limit_reached" | "employer_profile_required" | "forbidden";
        message: string;
        usage?: Awaited<ReturnType<SubscriptionService["canViewCandidate"]>>;
      };
    };

export async function validateCandidateProfileAccessPolicy(
  adminClient: SupabaseClient,
  subscriptionService: SubscriptionService,
  userId: string,
  role: string
): Promise<CandidateProfileAccessPolicyResult> {
  if (INTERNAL_CANDIDATE_ACCESS_ROLES.has(role)) {
    return {
      allowed: true,
      shouldTrackUsage: false,
      employer: null,
      usage: null
    };
  }

  if (role !== "employer") {
    return {
      allowed: false,
      status: 403,
      body: {
        error: "forbidden",
        message: "Only employers and internal MXVL users can open candidate profiles."
      }
    };
  }

  const { data: employer, error: employerError } = await adminClient
    .from("employers")
    .select("id, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (employerError || !employer?.id) {
    return {
      allowed: false,
      status: 409,
      body: {
        error: "employer_profile_required",
        message: "Complete your employer profile before opening candidate profiles."
      }
    };
  }

  const usage = await subscriptionService.canViewCandidate(employer.id);

  if (!usage.allowed) {
    return {
      allowed: false,
      status: 403,
      body: {
        error: "subscription_limit_reached",
        message: usage.reason || "Candidate profile view limit reached for the current subscription period.",
        usage
      }
    };
  }

  return {
    allowed: true,
    shouldTrackUsage: true,
    employer: {
      id: employer.id,
      userId: employer.user_id || userId
    },
    usage
  };
}
