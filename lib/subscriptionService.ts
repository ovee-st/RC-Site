import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type {
  EmployerSubscriptionBillingCycle,
  EmployerSubscriptionStatus,
  SubscriptionBillingType
} from "@/types/employerSubscription";

export type SubscriptionFeatureKey =
  | "post_job"
  | "view_candidate"
  | "ai_matching"
  | "resume_search"
  | "talent_pool"
  | "whatsapp_notifications"
  | "add_recruiter";

type LimitValue = number | null;
type UsageMetric = "jobs_posted" | "candidate_views" | "ai_credits_used" | "recruiter_accounts";
type UsageColumn = "jobs_used" | "candidate_views_used" | "ai_credits_used" | "recruiters_used";

type SubscriptionPlanRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  billing_type: SubscriptionBillingType;
  job_limit: LimitValue;
  candidate_view_limit: LimitValue;
  ai_credit_limit: LimitValue;
  recruiter_limit: LimitValue;
  monthly_price: number | null;
  one_time_price: number | null;
  access_days: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type EmployerSubscriptionRow = {
  id: string;
  employer_id: string;
  employer_user_id: string | null;
  plan_id: string;
  status: EmployerSubscriptionStatus;
  billing_cycle: EmployerSubscriptionBillingCycle;
  starts_at: string;
  ends_at: string | null;
  renews_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

type EmployerUsageRow = {
  id: string | null;
  employer_id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  jobs_used: number;
  candidate_views_used: number;
  ai_credits_used: number;
  recruiters_used: number;
  created_at: string | null;
  updated_at: string | null;
};

export type SubscriptionPlanDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  billingType: SubscriptionBillingType;
  jobLimit: LimitValue;
  candidateViewLimit: LimitValue;
  aiCreditLimit: LimitValue;
  recruiterLimit: LimitValue;
  monthlyPrice: number | null;
  oneTimePrice: number | null;
  accessDays: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployerSubscriptionDto = {
  id: string;
  employerId: string;
  employerUserId: string | null;
  planId: string;
  status: EmployerSubscriptionStatus;
  billingCycle: EmployerSubscriptionBillingCycle;
  startsAt: string;
  endsAt: string | null;
  renewsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployerUsageDto = {
  id: string | null;
  employerId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  jobsUsed: number;
  candidateViewsUsed: number;
  aiCreditsUsed: number;
  recruitersUsed: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CurrentPlanDto = {
  hasSubscription: boolean;
  plan: SubscriptionPlanDto | null;
  subscription: EmployerSubscriptionDto | null;
  usage: EmployerUsageDto | null;
};

export type FeatureAccessDto = {
  feature: SubscriptionFeatureKey;
  allowed: boolean;
  planSlug: string | null;
  limit: LimitValue;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  reason: string | null;
};

export type RemainingUsageItemDto = {
  limit: LimitValue;
  used: number;
  remaining: number | null;
  unlimited: boolean;
};

export type RemainingUsageDto = {
  employerId: string;
  planSlug: string | null;
  jobs: RemainingUsageItemDto;
  candidateViews: RemainingUsageItemDto;
  aiCredits: RemainingUsageItemDto;
  recruiters: RemainingUsageItemDto;
};

export type UsageTrackingDto = {
  recorded: boolean;
  metric: UsageMetric;
  amount: number;
  access: FeatureAccessDto;
  usage: EmployerUsageDto | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES: EmployerSubscriptionStatus[] = ["trialing", "active"];
const TALENT_POOL_PLAN_SLUGS = new Set(["elite", "enterprise"]);
const RESUME_SEARCH_PLAN_SLUGS = new Set(["one_time", "growth", "elite", "enterprise"]);
const WHATSAPP_NOTIFICATION_PLAN_SLUGS = new Set(["elite", "enterprise"]);
const UNLIMITED_EMPLOYER_EMAILS = new Set(["employer.admin@mxventurelab.com"]);
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export class SubscriptionService {
  private readonly unlimitedEmployerCache = new Map<string, boolean>();

  constructor(private readonly supabase: SupabaseClient = createServerSupabaseClient()) {}

  async getCurrentPlan(employerId: string): Promise<CurrentPlanDto> {
    const unlimitedEmployer = await this.isUnlimitedEmployer(employerId);
    const subscription = await this.getCurrentSubscriptionRow(employerId);

    if (!subscription) {
      return {
        hasSubscription: false,
        plan: null,
        subscription: null,
        usage: null
      };
    }

    const [plan, usage] = await Promise.all([
      this.getPlanRow(subscription.plan_id),
      this.getCurrentUsageRow(subscription)
    ]);

    if (!plan) {
      return {
        hasSubscription: false,
        plan: null,
        subscription: toSubscriptionDto(subscription),
        usage: usage ? toUsageDto(usage) : null
      };
    }

    const planDto = toPlanDto(plan);

    return {
      hasSubscription: true,
      plan: unlimitedEmployer ? withUnlimitedPlanLimits(planDto) : planDto,
      subscription: toSubscriptionDto(subscription),
      usage: toUsageDto(usage ?? buildEmptyUsage(subscription))
    };
  }

  async canPostJob(employerId: string): Promise<FeatureAccessDto> {
    return this.checkMeteredFeature(employerId, "post_job", "jobLimit", "jobsUsed");
  }

  async canViewCandidate(employerId: string): Promise<FeatureAccessDto> {
    return this.checkMeteredFeature(employerId, "view_candidate", "candidateViewLimit", "candidateViewsUsed");
  }

  async canUseAiMatching(employerId: string): Promise<FeatureAccessDto> {
    return this.hasFeature(employerId, "ai_matching");
  }

  async canSearchResume(employerId: string): Promise<FeatureAccessDto> {
    return this.hasFeature(employerId, "resume_search");
  }

  async canAccessTalentPool(employerId: string): Promise<FeatureAccessDto> {
    return this.hasFeature(employerId, "talent_pool");
  }

  async canAddRecruiter(employerId: string): Promise<FeatureAccessDto> {
    return this.checkMeteredFeature(employerId, "add_recruiter", "recruiterLimit", "recruitersUsed");
  }

  async getRemainingUsage(employerId: string): Promise<RemainingUsageDto> {
    const current = await this.getCurrentPlan(employerId);
    const unlimitedEmployer = await this.isUnlimitedEmployer(employerId);

    return {
      employerId,
      planSlug: current.plan?.slug ?? null,
      jobs: buildRemainingUsage(unlimitedEmployer ? null : current.plan?.jobLimit ?? 0, current.usage?.jobsUsed ?? 0),
      candidateViews: buildRemainingUsage(unlimitedEmployer ? null : current.plan?.candidateViewLimit ?? 0, current.usage?.candidateViewsUsed ?? 0),
      aiCredits: buildRemainingUsage(unlimitedEmployer ? null : current.plan?.aiCreditLimit ?? 0, current.usage?.aiCreditsUsed ?? 0),
      recruiters: buildRemainingUsage(unlimitedEmployer ? null : current.plan?.recruiterLimit ?? 0, current.usage?.recruitersUsed ?? 0)
    };
  }

  async recordJobPost(employerId: string, amount = 1): Promise<UsageTrackingDto> {
    return this.recordUsage(employerId, "jobs_posted", "post_job", "jobs_used", "jobLimit", amount);
  }

  async recordCandidateView(employerId: string, amount = 1): Promise<UsageTrackingDto> {
    return this.recordUsage(employerId, "candidate_views", "view_candidate", "candidate_views_used", "candidateViewLimit", amount);
  }

  async consumeAiCredit(employerId: string, amount = 1): Promise<UsageTrackingDto> {
    return this.recordUsage(employerId, "ai_credits_used", "ai_matching", "ai_credits_used", "aiCreditLimit", amount);
  }

  async hasFeature(employerId: string, feature: SubscriptionFeatureKey): Promise<FeatureAccessDto> {
    if (feature === "post_job") {
      return this.checkMeteredFeature(employerId, "post_job", "jobLimit", "jobsUsed");
    }

    if (feature === "view_candidate") {
      return this.checkMeteredFeature(employerId, "view_candidate", "candidateViewLimit", "candidateViewsUsed");
    }

    if (feature === "ai_matching") {
      return this.checkMeteredFeature(employerId, "ai_matching", "aiCreditLimit", "aiCreditsUsed");
    }

    if (feature === "resume_search") {
      return this.checkPlanFeature(employerId, "resume_search", RESUME_SEARCH_PLAN_SLUGS, "Resume search is not included in the current plan.");
    }

    if (feature === "talent_pool") {
      return this.checkPlanFeature(employerId, "talent_pool", TALENT_POOL_PLAN_SLUGS, "Talent pool access requires MXVL Elite or Enterprise.");
    }

    if (feature === "whatsapp_notifications") {
      return this.checkPlanFeature(
        employerId,
        "whatsapp_notifications",
        WHATSAPP_NOTIFICATION_PLAN_SLUGS,
        "WhatsApp notifications require MXVL Elite or Enterprise."
      );
    }

    return this.checkMeteredFeature(employerId, "add_recruiter", "recruiterLimit", "recruitersUsed");
  }

  private async checkMeteredFeature(
    employerId: string,
    feature: SubscriptionFeatureKey,
    planLimitKey: "jobLimit" | "candidateViewLimit" | "aiCreditLimit" | "recruiterLimit",
    usageKey: "jobsUsed" | "candidateViewsUsed" | "aiCreditsUsed" | "recruitersUsed"
  ): Promise<FeatureAccessDto> {
    if (await this.isUnlimitedEmployer(employerId)) {
      return buildUnlimitedFeatureAccess(feature);
    }

    const current = await this.getCurrentPlan(employerId);
    return buildAccessDto(current, feature, current.plan?.[planLimitKey] ?? 0, current.usage?.[usageKey] ?? 0);
  }

  private async checkPlanFeature(
    employerId: string,
    feature: SubscriptionFeatureKey,
    allowedPlanSlugs: Set<string>,
    unavailableReason: string
  ): Promise<FeatureAccessDto> {
    if (await this.isUnlimitedEmployer(employerId)) {
      return buildUnlimitedFeatureAccess(feature);
    }

    const current = await this.getCurrentPlan(employerId);
    const hasUsableSubscription = Boolean(
      current.hasSubscription &&
      current.subscription &&
      ACTIVE_SUBSCRIPTION_STATUSES.includes(current.subscription.status)
    );
    const allowed = Boolean(hasUsableSubscription && current.plan && allowedPlanSlugs.has(current.plan.slug));

    return {
      feature,
      allowed,
      planSlug: current.plan?.slug ?? null,
      limit: null,
      used: 0,
      remaining: null,
      unlimited: allowed,
      reason: allowed ? null : hasUsableSubscription ? unavailableReason : "No active subscription found."
    };
  }

  private async recordUsage(
    employerId: string,
    metric: UsageMetric,
    feature: SubscriptionFeatureKey,
    usageColumn: UsageColumn,
    planLimitKey: "jobLimit" | "candidateViewLimit" | "aiCreditLimit" | "recruiterLimit",
    amount: number
  ): Promise<UsageTrackingDto> {
    assertPositiveUsageAmount(amount);

    if (await this.isUnlimitedEmployer(employerId)) {
      return {
        recorded: true,
        metric,
        amount,
        access: buildUnlimitedFeatureAccess(feature),
        usage: null
      };
    }

    const subscription = await this.getCurrentSubscriptionRow(employerId);
    if (!subscription) {
      return buildUnrecordedUsage(metric, amount, feature, null, null, 0, "No active subscription found.");
    }

    const [plan, currentUsage] = await Promise.all([
      this.getPlanRow(subscription.plan_id),
      this.getCurrentUsageRow(subscription)
    ]);

    if (!plan) {
      return buildUnrecordedUsage(metric, amount, feature, null, null, 0, "No active subscription plan found.");
    }

    const usage = currentUsage ?? await this.createUsageRow(subscription);
    const planDto = toPlanDto(plan);
    const usageDto = toUsageDto(usage);
    const access = buildAccessDto(
      {
        hasSubscription: true,
        plan: planDto,
        subscription: toSubscriptionDto(subscription),
        usage: usageDto
      },
      feature,
      planDto[planLimitKey],
      usageDto[usageDtoKeyForColumn(usageColumn)]
    );

    if (!access.allowed || (!access.unlimited && access.remaining !== null && access.remaining < amount)) {
      return {
        recorded: false,
        metric,
        amount,
        access: {
          ...access,
          allowed: false,
          reason: access.reason ?? "Usage limit reached for the current subscription period."
        },
        usage: usageDto
      };
    }

    const updatedUsage = await this.updateUsageCounter(usage, usageColumn, amount);

    return {
      recorded: true,
      metric,
      amount,
      access,
      usage: toUsageDto(updatedUsage)
    };
  }

  private async createUsageRow(subscription: EmployerSubscriptionRow): Promise<EmployerUsageRow> {
    const period = getUsagePeriod(subscription);
    const { data, error } = await this.supabase
      .from("employer_usage")
      .insert({
        employer_id: subscription.employer_id,
        subscription_id: subscription.id,
        period_start: period.periodStart,
        period_end: period.periodEnd,
        jobs_used: 0,
        candidate_views_used: 0,
        ai_credits_used: 0,
        recruiters_used: 0
      })
      .select("*")
      .single();

    if (error) throw new Error(`Could not create employer usage period: ${error.message}`);
    return data as EmployerUsageRow;
  }

  private async updateUsageCounter(usage: EmployerUsageRow, usageColumn: UsageColumn, amount: number): Promise<EmployerUsageRow> {
    if (!usage.id) throw new Error("Cannot update employer usage without a persisted usage row.");

    const { data, error } = await this.supabase
      .from("employer_usage")
      .update({
        [usageColumn]: usage[usageColumn] + amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", usage.id)
      .select("*")
      .single();

    if (error) throw new Error(`Could not update employer usage: ${error.message}`);
    return data as EmployerUsageRow;
  }

  private async isUnlimitedEmployer(employerId: string): Promise<boolean> {
    const cached = this.unlimitedEmployerCache.get(employerId);
    if (cached !== undefined) return cached;

    let result = await this.supabase
      .from("employers")
      .select("email, official_email")
      .eq("id", employerId)
      .maybeSingle();

    if (result.error && /column|schema cache|does not exist/i.test(result.error.message || "")) {
      result = await this.supabase
        .from("employers")
        .select("*")
        .eq("id", employerId)
        .maybeSingle();
    }

    if (result.error) throw new Error(`Could not resolve employer access: ${result.error.message}`);
    const emails = [result.data?.email, result.data?.official_email]
      .filter(Boolean)
      .map((email) => String(email).trim().toLowerCase());
    const unlimited = emails.some((email) => UNLIMITED_EMPLOYER_EMAILS.has(email));
    this.unlimitedEmployerCache.set(employerId, unlimited);
    return unlimited;
  }

  private async getCurrentSubscriptionRow(employerId: string): Promise<EmployerSubscriptionRow | null> {
    const { data, error } = await this.supabase
      .from("employer_subscriptions")
      .select("*")
      .eq("employer_id", employerId)
      .in("status", ACTIVE_SUBSCRIPTION_STATUSES)
      .order("updated_at", { ascending: false })
      .order("starts_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Could not load employer subscription: ${error.message}`);
    return (data as EmployerSubscriptionRow | null) ?? null;
  }

  private async getPlanRow(planId: string): Promise<SubscriptionPlanRow | null> {
    const { data, error } = await this.supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(`Could not load subscription plan: ${error.message}`);
    return (data as SubscriptionPlanRow | null) ?? null;
  }

  private async getCurrentUsageRow(subscription: EmployerSubscriptionRow): Promise<EmployerUsageRow | null> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("employer_usage")
      .select("*")
      .eq("subscription_id", subscription.id)
      .lte("period_start", now)
      .gt("period_end", now)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(`Could not load employer usage: ${error.message}`);
    return (data as EmployerUsageRow | null) ?? null;
  }
}

export function createSubscriptionService(supabase?: SupabaseClient) {
  return new SubscriptionService(supabase);
}

function buildAccessDto(current: CurrentPlanDto, feature: SubscriptionFeatureKey, limit: LimitValue, used: number): FeatureAccessDto {
  const usage = buildRemainingUsage(limit, used);
  const hasUsableSubscription = Boolean(current.hasSubscription && current.subscription && ACTIVE_SUBSCRIPTION_STATUSES.includes(current.subscription.status));
  const allowed = hasUsableSubscription && (usage.unlimited || usage.remaining === null || usage.remaining > 0);

  return {
    feature,
    allowed,
    planSlug: current.plan?.slug ?? null,
    limit,
    used,
    remaining: usage.remaining,
    unlimited: usage.unlimited,
    reason: getAccessReason(hasUsableSubscription, usage)
  };
}

function buildUnlimitedFeatureAccess(feature: SubscriptionFeatureKey): FeatureAccessDto {
  return {
    feature,
    allowed: true,
    planSlug: null,
    limit: null,
    used: 0,
    remaining: null,
    unlimited: true,
    reason: null
  };
}

function withUnlimitedPlanLimits(plan: SubscriptionPlanDto): SubscriptionPlanDto {
  return {
    ...plan,
    jobLimit: null,
    candidateViewLimit: null,
    aiCreditLimit: null,
    recruiterLimit: null
  };
}

function buildUnrecordedUsage(
  metric: UsageMetric,
  amount: number,
  feature: SubscriptionFeatureKey,
  planSlug: string | null,
  limit: LimitValue,
  used: number,
  reason: string
): UsageTrackingDto {
  return {
    recorded: false,
    metric,
    amount,
    access: {
      feature,
      allowed: false,
      planSlug,
      limit,
      used,
      remaining: limit === null ? null : Math.max(limit - used, 0),
      unlimited: limit === null,
      reason
    },
    usage: null
  };
}

function assertPositiveUsageAmount(amount: number) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Usage amount must be a positive integer.");
  }
}

function usageDtoKeyForColumn(usageColumn: UsageColumn): "jobsUsed" | "candidateViewsUsed" | "aiCreditsUsed" | "recruitersUsed" {
  if (usageColumn === "jobs_used") return "jobsUsed";
  if (usageColumn === "candidate_views_used") return "candidateViewsUsed";
  if (usageColumn === "ai_credits_used") return "aiCreditsUsed";
  return "recruitersUsed";
}

function getUsagePeriod(subscription: EmployerSubscriptionRow) {
  const startsAt = new Date(subscription.starts_at);
  const periodStart = startsAt.toISOString();
  const explicitEnd = subscription.ends_at ?? subscription.renews_at;

  if (explicitEnd) {
    return {
      periodStart,
      periodEnd: new Date(explicitEnd).toISOString()
    };
  }

  const periodEnd = new Date(startsAt);
  if (subscription.billing_cycle === "one_time") {
    periodEnd.setTime(periodEnd.getTime() + 15 * ONE_DAY_IN_MS);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  return {
    periodStart,
    periodEnd: periodEnd.toISOString()
  };
}

function buildRemainingUsage(limit: LimitValue, used: number): RemainingUsageItemDto {
  if (limit === null) {
    return {
      limit,
      used,
      remaining: null,
      unlimited: true
    };
  }

  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    unlimited: false
  };
}

function getAccessReason(hasUsableSubscription: boolean, usage: RemainingUsageItemDto) {
  if (!hasUsableSubscription) return "No active subscription found.";
  if (!usage.unlimited && usage.remaining === 0) return "Usage limit reached for the current subscription period.";
  return null;
}

function buildEmptyUsage(subscription: EmployerSubscriptionRow): EmployerUsageRow {
  return {
    id: null,
    employer_id: subscription.employer_id,
    subscription_id: subscription.id,
    period_start: subscription.starts_at,
    period_end: subscription.ends_at ?? subscription.renews_at ?? new Date().toISOString(),
    jobs_used: 0,
    candidate_views_used: 0,
    ai_credits_used: 0,
    recruiters_used: 0,
    created_at: null,
    updated_at: null
  };
}

function toPlanDto(row: SubscriptionPlanRow): SubscriptionPlanDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    billingType: row.billing_type,
    jobLimit: row.job_limit,
    candidateViewLimit: row.candidate_view_limit,
    aiCreditLimit: row.ai_credit_limit,
    recruiterLimit: row.recruiter_limit,
    monthlyPrice: row.monthly_price,
    oneTimePrice: row.one_time_price,
    accessDays: row.access_days,
    isActive: row.is_active,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toSubscriptionDto(row: EmployerSubscriptionRow): EmployerSubscriptionDto {
  return {
    id: row.id,
    employerId: row.employer_id,
    employerUserId: row.employer_user_id,
    planId: row.plan_id,
    status: row.status,
    billingCycle: row.billing_cycle,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    renewsAt: row.renews_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toUsageDto(row: EmployerUsageRow): EmployerUsageDto {
  return {
    id: row.id,
    employerId: row.employer_id,
    subscriptionId: row.subscription_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    jobsUsed: row.jobs_used,
    candidateViewsUsed: row.candidate_views_used,
    aiCreditsUsed: row.ai_credits_used,
    recruitersUsed: row.recruiters_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
