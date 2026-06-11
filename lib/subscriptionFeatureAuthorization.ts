import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeatureAccessDto, SubscriptionFeatureKey, SubscriptionService } from "@/lib/subscriptionService";

export type SubscriptionFeatureAuthorizationResult =
  | {
      allowed: true;
      employer: {
        id: string;
        userId: string;
      };
      access: FeatureAccessDto;
    }
  | {
      allowed: false;
      status: number;
      body: {
        error: "employer_profile_required" | "subscription_feature_unavailable";
        message: string;
        feature: SubscriptionFeatureKey;
        access?: FeatureAccessDto;
      };
    };

export async function authorizeSubscriptionFeature(
  adminClient: SupabaseClient,
  subscriptionService: Pick<SubscriptionService, "hasFeature">,
  userId: string,
  feature: SubscriptionFeatureKey
): Promise<SubscriptionFeatureAuthorizationResult> {
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
        message: "Complete your employer profile before using this feature.",
        feature
      }
    };
  }

  const access = await subscriptionService.hasFeature(employer.id, feature);

  if (!access.allowed) {
    return {
      allowed: false,
      status: 403,
      body: {
        error: "subscription_feature_unavailable",
        message: access.reason || "This feature is not available on the current subscription plan.",
        feature,
        access
      }
    };
  }

  return {
    allowed: true,
    employer: {
      id: employer.id,
      userId: employer.user_id || userId
    },
    access
  };
}

export function assertSubscriptionFeature(result: SubscriptionFeatureAuthorizationResult) {
  if (result.allowed) return null;
  return Response.json(result.body, { status: result.status });
}
