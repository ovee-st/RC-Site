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
    discountPercentage: number;
  } | null;
};

type PlanRow = {
  id: string;
  slug: string;
  name: string;
  billing_type: "one_time" | "recurring" | "custom";
  monthly_price: number | null;
  yearly_price: number | null;
  one_time_price: number | null;
  access_days: number | null;
};

type CouponRow = {
  id: string;
  coupon_name: string | null;
  code: string;
  discount_percentage: number;
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

export function getPlanAmount(plan: PlanRow, billingCycle: "monthly" | "yearly" | "one_time" = "monthly") {
  if (plan.billing_type === "one_time") return Number(plan.one_time_price || 0);
  if (billingCycle === "yearly") return Number(plan.yearly_price || 0);
  return Number(plan.monthly_price || 0);
}

export function normalizeCouponCode(couponCode?: string | null) {
  return String(couponCode || "").trim().toUpperCase();
}

export function validateExistingCoupon(coupon: ExistingCoupon | null, now = new Date()) {
  if (!coupon) throw new Error("Coupon code is invalid.");
  if (!coupon.active) throw new Error("Coupon code is not active.");
  if (coupon.expires_at && new Date(coupon.expires_at) < now) throw new Error("Coupon code has expired.");
  if (coupon.usage_limit !== null && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    throw new Error("Coupon usage limit has been reached.");
  }
  if (!Number.isFinite(Number(coupon.discount_percentage)) || Number(coupon.discount_percentage) < 1 || Number(coupon.discount_percentage) > 100) {
    throw new Error("Coupon discount is invalid.");
  }
  return coupon;
}

export function calculateCouponDiscount(originalAmount: number, coupon: ExistingCoupon) {
  return Math.min(originalAmount, Math.round(originalAmount * (Number(coupon.discount_percentage) / 100)));
}

export function calculateExpiryDate(plan: PlanRow, start = new Date(), billingCycle: "monthly" | "yearly" | "one_time" = "monthly") {
  const expiry = new Date(start);
  if (plan.billing_type === "one_time") {
    expiry.setDate(expiry.getDate() + Number(plan.access_days || 15));
  } else if (billingCycle === "yearly") {
    expiry.setFullYear(expiry.getFullYear() + 1);
  } else {
    expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}

export async function getActivePlan(client: SupabaseClient, planIdOrSlug: string): Promise<PlanRow> {
  const byId = await client.from("subscription_plans").select("*").eq("id", planIdOrSlug).eq("is_active", true).maybeSingle();
  const plan = byId.data || (await client.from("subscription_plans").select("*").eq("slug", planIdOrSlug).eq("is_active", true).maybeSingle()).data;
  if (!plan) throw new Error("Selected subscription plan was not found.");
  return plan as PlanRow;
}

export async function calculatePaymentBreakdown(
  client: SupabaseClient,
  plan: PlanRow,
  couponCode?: string | null,
  billingCycle: "monthly" | "yearly" | "one_time" = "monthly"
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
      discountPercentage: Number(row.discount_percentage)
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
