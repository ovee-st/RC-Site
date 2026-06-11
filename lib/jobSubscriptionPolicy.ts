import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionService } from "@/lib/subscriptionService";

export type JobCreationPolicyResult =
  | {
      allowed: true;
      employer: {
        id: string;
        userId: string;
      };
      usage: Awaited<ReturnType<SubscriptionService["canPostJob"]>>;
    }
  | {
      allowed: false;
      status: number;
      body: {
        error: string;
        code: "EMPLOYER_PROFILE_REQUIRED" | "SUBSCRIPTION_REQUIRED" | "JOB_LIMIT_REACHED";
        usage?: Awaited<ReturnType<SubscriptionService["canPostJob"]>>;
      };
    };

export async function validateJobCreationPolicy(
  adminClient: SupabaseClient,
  subscriptionService: SubscriptionService,
  userId: string
): Promise<JobCreationPolicyResult> {
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
        error: "Complete your employer profile before posting jobs.",
        code: "EMPLOYER_PROFILE_REQUIRED"
      }
    };
  }

  const usage = await subscriptionService.canPostJob(employer.id);

  if (!usage.allowed) {
    return {
      allowed: false,
      status: usage.reason === "No active subscription found." ? 402 : 403,
      body: {
        error: usage.reason || "Your current subscription does not allow another job post.",
        code: usage.reason === "No active subscription found." ? "SUBSCRIPTION_REQUIRED" : "JOB_LIMIT_REACHED",
        usage
      }
    };
  }

  return {
    allowed: true,
    employer: {
      id: employer.id,
      userId: employer.user_id || userId
    },
    usage
  };
}
