export type SubscriptionBillingType = "one_time" | "recurring" | "custom";
export type EmployerSubscriptionBillingCycle = "one_time" | "monthly";
export type EmployerSubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";

export type SubscriptionPlan = {
  id: string;
  slug: "one_time" | "starter" | "growth" | "elite" | "enterprise" | string;
  name: string;
  description: string | null;
  billingType: SubscriptionBillingType;
  jobLimit: number | null;
  candidateViewLimit: number | null;
  aiCreditLimit: number | null;
  recruiterLimit: number | null;
  monthlyPrice: number | null;
  oneTimePrice: number | null;
  accessDays: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployerSubscription = {
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

export type EmployerUsage = {
  id: string;
  employerId: string;
  subscriptionId: string;
  periodStart: string;
  periodEnd: string;
  jobsUsed: number;
  candidateViewsUsed: number;
  aiCreditsUsed: number;
  recruitersUsed: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployerSubscriptionWithPlan = EmployerSubscription & {
  plan: SubscriptionPlan;
};

export type EmployerUsageWithSubscription = EmployerUsage & {
  subscription: EmployerSubscriptionWithPlan;
};
