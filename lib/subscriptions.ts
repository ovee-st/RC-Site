export type BillingCycle = "monthly" | "yearly" | "one_time";
export type EmployerPlanId = "starter" | "one_time" | "growth" | "elite" | "enterprise";
export type UsageLimit = number | "unlimited";
export type PaywallType = "candidateViews" | "aiMatching" | "resumeDatabase";

export interface EmployerPlan {
  id: EmployerPlanId;
  name: string;
  tagline: string;
  badge?: string;
  monthlyPrice: number | null;
  billingType?: "recurring" | "one-time";
  highlight?: boolean;
  aiCredits: number | "unlimited" | 0;
  recruiterSeats: UsageLimit;
  limits: {
    activeJobs: UsageLimit;
    candidateViews: UsageLimit;
    resumeSearches: UsageLimit;
  };
  features: string[];
  cta: string;
}

export const EMPLOYER_PLANS: EmployerPlan[] = [
  {
    id: "starter",
    name: "MXVL Starter",
    tagline: "For occasional hiring.",
    monthlyPrice: 2500,
    aiCredits: 0,
    recruiterSeats: 1,
    limits: {
      activeJobs: 3,
      candidateViews: 50,
      resumeSearches: 0
    },
    features: [
      "3 Active Jobs",
      "50 Candidate Profile Views / Month",
      "Basic ATS",
      "Application Tracking",
      "Email Notifications",
      "Single Recruiter Account",
      "Standard Support"
    ],
    cta: "Start with Starter"
  },
  {
    id: "one_time",
    name: "MXVL One-Time",
    tagline: "A short hiring sprint for urgent roles.",
    badge: "15-DAY PASS",
    billingType: "one-time",
    monthlyPrice: 1500,
    aiCredits: 0,
    recruiterSeats: 1,
    limits: {
      activeJobs: 3,
      candidateViews: 20,
      resumeSearches: 20
    },
    features: [
      "3 Job Posts",
      "20 Candidate CV Access",
      "15 Days Access",
      "Basic ATS",
      "Application Tracking",
      "Email Notifications",
      "Single Recruiter Account",
      "Standard Support"
    ],
    cta: "Buy One-Time Pass"
  },
  {
    id: "growth",
    name: "MXVL Growth",
    tagline: "Built for teams scaling active hiring.",
    badge: "MOST POPULAR",
    monthlyPrice: 7500,
    highlight: true,
    aiCredits: 100,
    recruiterSeats: 3,
    limits: {
      activeJobs: 10,
      candidateViews: 500,
      resumeSearches: 500
    },
    features: [
      "10 Active Jobs",
      "500 Candidate Profile Views",
      "AI Candidate Matching",
      "Resume Search",
      "Candidate Shortlisting",
      "Interview Scheduling",
      "Hiring Analytics",
      "3 Recruiter Accounts",
      "Priority Support"
    ],
    cta: "Upgrade to Growth"
  },
  {
    id: "elite",
    name: "MXVL Elite",
    tagline: "Premium AI recruiting for high-volume teams.",
    monthlyPrice: 15000,
    aiCredits: 1000,
    recruiterSeats: 10,
    limits: {
      activeJobs: "unlimited",
      candidateViews: "unlimited",
      resumeSearches: "unlimited"
    },
    features: [
      "Unlimited Jobs",
      "Unlimited Candidate Views",
      "AI Recruiter Assistant",
      "Candidate Match Score",
      "Talent Pool Access",
      "WhatsApp Notifications",
      "Advanced Analytics",
      "Team Collaboration",
      "Employer Branding Page",
      "Featured Company Listing",
      "10 Recruiter Accounts"
    ],
    cta: "Move to Elite"
  },
  {
    id: "enterprise",
    name: "MXVL Enterprise",
    tagline: "Custom recruitment operating system for large teams.",
    monthlyPrice: null,
    aiCredits: "unlimited",
    recruiterSeats: "unlimited",
    limits: {
      activeJobs: "unlimited",
      candidateViews: "unlimited",
      resumeSearches: "unlimited"
    },
    features: [
      "Everything in Elite",
      "Unlimited Recruiters",
      "API Access",
      "Dedicated Account Manager",
      "Custom Workflows",
      "White Label Career Portal",
      "Recruitment Automation",
      "SLA Support",
      "Custom Integrations",
      "Enterprise Reporting"
    ],
    cta: "Contact Sales"
  }
];

export const UPGRADE_BENEFITS = [
  "AI Candidate Matching",
  "Resume Database Access",
  "Employer Branding",
  "Advanced Analytics",
  "Team Collaboration",
  "Faster Hiring Pipeline"
];

export const PAYWALLS: Record<PaywallType, { title: string; description: string; cta: string }> = {
  candidateViews: {
    title: "Candidate View Limit Reached",
    description:
      "You have viewed 50 candidates this month. Upgrade to MXVL Growth to unlock 500 candidate views and AI-powered candidate recommendations.",
    cta: "Upgrade to Growth"
  },
  aiMatching: {
    title: "AI Matching Locked",
    description:
      "AI Candidate Matching is available on MXVL Growth and above. Let MXVL automatically rank the best candidates for your jobs.",
    cta: "Unlock AI Matching"
  },
  resumeDatabase: {
    title: "Resume Database Locked",
    description: "Access thousands of verified candidate profiles. Upgrade your plan to unlock MXVL Talent Search.",
    cta: "Upgrade Now"
  }
};

export const DEMO_EMPLOYER_USAGE = {
  currentPlanId: "growth" as EmployerPlanId,
  renewalDate: "15 July 2026",
  jobsUsed: 7,
  jobsLimit: 10 as UsageLimit,
  candidateViewsUsed: 285,
  candidateViewsLimit: 500 as UsageLimit,
  recruiterSeatsUsed: 2,
  recruiterSeatsLimit: 3 as UsageLimit,
  aiCreditsUsed: 64,
  aiCreditsLimit: 100 as UsageLimit,
  resumeSearchesUsed: 38,
  resumeSearchesLimit: 150 as UsageLimit
};

export const AI_CREDIT_CONSUMPTION = [
  "Candidate scoring",
  "Resume analysis",
  "AI recommendations",
  "Automated screening"
];

export function formatCurrencyBDT(value: number) {
  return `BDT ${new Intl.NumberFormat("en-US").format(value)}`;
}

export function getPlanPriceLabel(plan: EmployerPlan, billingCycle: BillingCycle) {
  if (plan.monthlyPrice === null) return "Contact Sales";
  if (plan.billingType === "one-time") return `${formatCurrencyBDT(plan.monthlyPrice)} one-time`;
  if (billingCycle === "monthly") return `${formatCurrencyBDT(plan.monthlyPrice)}/month`;
  return `${formatCurrencyBDT(Math.round(plan.monthlyPrice * 12 * 0.8))}/year`;
}

export function getMonthlyEquivalent(plan: EmployerPlan, billingCycle: BillingCycle) {
  if (plan.monthlyPrice === null || plan.billingType === "one-time") return null;
  if (billingCycle === "monthly") return plan.monthlyPrice;
  return Math.round(plan.monthlyPrice * 0.8);
}

export function getUsagePercent(used: number, limit: UsageLimit) {
  if (limit === "unlimited") return 100;
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function getLimitLabel(limit: UsageLimit) {
  return limit === "unlimited" ? "Unlimited" : new Intl.NumberFormat("en-US").format(limit);
}
