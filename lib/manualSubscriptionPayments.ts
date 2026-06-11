import type { SupabaseClient } from "@supabase/supabase-js";

export type ManualPaymentMethod = "bkash" | "nagad";

export const MANUAL_PAYMENT_METHODS: Record<ManualPaymentMethod, { label: string; number: string; storageValue: string }> = {
  bkash: {
    label: "bKash",
    number: "01979611120",
    storageValue: "bkash_manual"
  },
  nagad: {
    label: "Nagad",
    number: "01979611120",
    storageValue: "nagad_manual"
  }
};

export const PAYMENT_REFERENCE = "MXVL Subscription";

export function normalizeManualPaymentMethod(value?: string | null): ManualPaymentMethod {
  return String(value || "").toLowerCase() === "nagad" || String(value || "").toLowerCase() === "nagad_manual" ? "nagad" : "bkash";
}

export type PaymentStatus = "pending" | "approved" | "rejected" | "more_info";

export type PriceBreakdown = {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon: {
    id: string;
    code: string;
    name: string | null;
    discountType: "percentage" | "fixed";
    discountPercentage: number;
    discountAmount: number | null;
  } | null;
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  billing_type: "one_time" | "recurring" | "custom";
  monthly_price: number | null;
  one_time_price: number | null;
  access_days: number | null;
};

const PLAN_LOOKUP_ALIASES: Record<string, string[]> = {
  one_time: ["one_time", "one-time", "mxvl-one-time", "mxvl one-time", "mxvl one-time pass"],
  starter: ["starter", "mxvl-starter", "mxvl starter"],
  growth: ["growth", "mxvl-growth", "mxvl growth"],
  elite: ["elite", "mxvl-elite", "mxvl elite"],
  enterprise: ["enterprise", "mxvl-enterprise", "mxvl enterprise"]
};

type CouponRow = {
  id: string;
  coupon_name: string | null;
  code: string;
  discount_percentage: number;
  discount_type?: "percentage" | "fixed" | null;
  discount_amount?: number | null;
  active: boolean;
  usage_limit: number | null;
  used_count: number | null;
  expires_at: string | null;
};

export type ExistingCoupon = CouponRow;

export function assertValidTransactionId(transactionId: string) {
  if (!/^[A-Za-z0-9]{6,32}$/.test(transactionId)) {
    throw new Error("Transaction ID must be 6-32 letters or numbers.");
  }
}

export function assertValidSenderDigits(senderLast3Digits: string) {
  if (!/^[0-9]{3}$/.test(senderLast3Digits)) {
    throw new Error("Sender number must include exactly the last 3 digits.");
  }
}

export type ManualSubscriptionBillingCycle = "monthly" | "one_time";

export function normalizeManualBillingCycle(value: unknown): ManualSubscriptionBillingCycle {
  if (value === undefined || value === null || value === "") return "monthly";
  if (value === "monthly" || value === "one_time") return value;
  throw new Error("Unsupported billing cycle.");
}

export function getPlanAmount(plan: PlanRow, billingCycle: ManualSubscriptionBillingCycle = "monthly") {
  if (plan.billing_type === "one_time") return Number(plan.one_time_price || 0);
  return Number(plan.monthly_price || 0);
}

export function normalizeCouponCode(couponCode?: string | null) {
  return String(couponCode || "").trim().toUpperCase();
}

function normalizePlanLookupValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function buildPlanLookupValues(planIdOrSlug: string) {
  const normalized = normalizePlanLookupValue(planIdOrSlug);
  const values = new Set([planIdOrSlug.trim(), normalized, normalized.replace(/-/g, "_")]);

  Object.entries(PLAN_LOOKUP_ALIASES).forEach(([canonical, aliases]) => {
    if (canonical === normalized.replace(/-/g, "_") || aliases.some((alias) => normalizePlanLookupValue(alias) === normalized)) {
      values.add(canonical);
      aliases.forEach((alias) => values.add(alias));
    }
  });

  return [...values].filter(Boolean);
}

export function validateExistingCoupon(coupon: ExistingCoupon | null, now = new Date()) {
  if (!coupon) throw new Error("Coupon code is invalid.");
  if (!coupon.active) throw new Error("Coupon code is not active.");
  if (coupon.expires_at && new Date(coupon.expires_at) < now) throw new Error("Coupon code has expired.");
  if (coupon.usage_limit !== null && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    throw new Error("Coupon usage limit has been reached.");
  }
  const discountType = coupon.discount_type === "fixed" ? "fixed" : "percentage";
  if (discountType === "fixed") {
    if (!Number.isFinite(Number(coupon.discount_amount)) || Number(coupon.discount_amount) <= 0) {
      throw new Error("Coupon discount is invalid.");
    }
  } else if (!Number.isFinite(Number(coupon.discount_percentage)) || Number(coupon.discount_percentage) < 1 || Number(coupon.discount_percentage) > 100) {
    throw new Error("Coupon discount is invalid.");
  }
  return coupon;
}

export function calculateCouponDiscount(originalAmount: number, coupon: ExistingCoupon) {
  if (coupon.discount_type === "fixed") {
    return Math.min(originalAmount, Math.round(Number(coupon.discount_amount || 0)));
  }
  return Math.min(originalAmount, Math.round(originalAmount * (Number(coupon.discount_percentage) / 100)));
}

export function calculateExpiryDate(plan: PlanRow, start = new Date(), billingCycle: ManualSubscriptionBillingCycle = "monthly") {
  const expiry = new Date(start);
  if (plan.billing_type === "one_time") {
    expiry.setDate(expiry.getDate() + Number(plan.access_days || 15));
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}

export async function getActivePlan(client: SupabaseClient, planIdOrSlug: string): Promise<PlanRow> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planIdOrSlug);
  let plan = isUuid
    ? (await client.from("subscription_plans").select("*").eq("id", planIdOrSlug).eq("is_active", true).maybeSingle()).data
    : null;

  if (!plan) {
    const lookupValues = buildPlanLookupValues(planIdOrSlug);
    const { data } = await client
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true);

    const activePlans = (Array.isArray(data) ? data : []) as PlanRow[];
    plan = activePlans.find((row) => {
      const rowValues = [row.id, row.slug, row.name].map(normalizePlanLookupValue);
      return lookupValues.some((value) => rowValues.includes(normalizePlanLookupValue(value)));
    }) ?? null;
  }

  if (!plan) throw new Error("Selected subscription plan was not found.");
  return plan as PlanRow;
}

export async function calculatePaymentBreakdown(
  client: SupabaseClient,
  plan: PlanRow,
  couponCode?: string | null,
  billingCycle: ManualSubscriptionBillingCycle = "monthly"
): Promise<PriceBreakdown> {
  const originalAmount = getPlanAmount(plan, billingCycle);
  const code = normalizeCouponCode(couponCode);

  if (!code) {
    return { originalAmount, discountAmount: 0, finalAmount: originalAmount, coupon: null };
  }

  const { data: coupon, error } = await client.from("coupons").select("*").eq("code", code).maybeSingle();
  if (error || !coupon) throw new Error("Coupon code is invalid.");

  const row = validateExistingCoupon(coupon as CouponRow);
  const discountAmount = calculateCouponDiscount(originalAmount, row);
  return {
    originalAmount,
    discountAmount,
    finalAmount: Math.max(originalAmount - discountAmount, 0),
    coupon: {
      id: row.id,
      code: row.code,
      name: row.coupon_name || null,
      discountType: row.discount_type === "fixed" ? "fixed" : "percentage",
      discountPercentage: Number(row.discount_percentage || 0),
      discountAmount: row.discount_amount === undefined || row.discount_amount === null ? null : Number(row.discount_amount)
    }
  };
}

export async function recordCouponUsage(client: SupabaseClient, couponId: string) {
  const { data: coupon, error } = await client.from("coupons").select("used_count").eq("id", couponId).maybeSingle();
  if (error) throw error;
  if (!coupon) throw new Error("Coupon was not found.");

  const { error: updateError } = await client
    .from("coupons")
    .update({ used_count: Number((coupon as { used_count?: number | null }).used_count || 0) + 1 })
    .eq("id", couponId);
  if (updateError) throw updateError;
}
