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
export type SubscriptionDebugEvent = {
  step: string;
  details: Record<string, unknown>;
};

const BASE_COUPON_COLUMNS = "id,coupon_name,code,discount_percentage,active,usage_limit,used_count,expires_at";
const OPTIONAL_COUPON_COLUMNS = "discount_type,discount_amount";

function logSubscriptionDebug(message: string, details: Record<string, unknown>, debugTrail?: SubscriptionDebugEvent[]) {
  console.info(`[subscription-payments/debug] ${message}`, details);
  debugTrail?.push({ step: message, details });
}

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

export function validateExistingCoupon(coupon: ExistingCoupon | null, now = new Date(), debugTrail?: SubscriptionDebugEvent[]) {
  if (!coupon) {
    logSubscriptionDebug("coupon validation failed", { reason: "not_found" }, debugTrail);
    throw new Error("Coupon code was not found.");
  }
  if (!coupon.active) {
    logSubscriptionDebug("coupon validation failed", { couponId: coupon.id, code: coupon.code, reason: "inactive" }, debugTrail);
    throw new Error("Coupon code is not active.");
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    logSubscriptionDebug("coupon validation failed", { couponId: coupon.id, code: coupon.code, reason: "expired", expiresAt: coupon.expires_at }, debugTrail);
    throw new Error("Coupon code has expired.");
  }
  if (coupon.usage_limit !== null && Number(coupon.used_count || 0) >= Number(coupon.usage_limit)) {
    logSubscriptionDebug("coupon validation failed", {
      couponId: coupon.id,
      code: coupon.code,
      reason: "usage_limit_reached",
      usageLimit: coupon.usage_limit,
      usedCount: coupon.used_count
    }, debugTrail);
    throw new Error("Coupon usage limit has been reached.");
  }
  const discountType = coupon.discount_type === "fixed" ? "fixed" : "percentage";
  if (discountType === "fixed") {
    const fixedAmount = Number(coupon.discount_amount || coupon.discount_percentage || 0);
    if (!Number.isFinite(fixedAmount) || fixedAmount <= 0) {
      logSubscriptionDebug("coupon validation failed", {
        couponId: coupon.id,
        code: coupon.code,
        reason: "invalid_fixed_discount",
        discountAmount: coupon.discount_amount ?? null,
        discountPercentage: coupon.discount_percentage
      }, debugTrail);
      throw new Error("Coupon discount is invalid.");
    }
  } else if (!Number.isFinite(Number(coupon.discount_percentage)) || Number(coupon.discount_percentage) < 1 || Number(coupon.discount_percentage) > 100) {
    logSubscriptionDebug("coupon validation failed", {
      couponId: coupon.id,
      code: coupon.code,
      reason: "invalid_percentage_discount",
      discountPercentage: coupon.discount_percentage
    }, debugTrail);
    throw new Error("Coupon discount is invalid.");
  }
  logSubscriptionDebug("coupon validation passed", {
    couponId: coupon.id,
    code: coupon.code,
    active: coupon.active,
    expiresAt: coupon.expires_at,
    discountType,
    discountPercentage: coupon.discount_percentage,
    discountAmount: coupon.discount_amount ?? null,
    usageLimit: coupon.usage_limit,
    usedCount: coupon.used_count,
    applicableModules: "platform-wide"
  }, debugTrail);
  return coupon;
}

export function calculateCouponDiscount(originalAmount: number, coupon: ExistingCoupon) {
  if (coupon.discount_type === "fixed") {
    const fixedAmount = Number(coupon.discount_amount || coupon.discount_percentage || 0);
    return Math.min(originalAmount, Math.round(fixedAmount));
  }
  return Math.min(originalAmount, Math.round(originalAmount * (Number(coupon.discount_percentage) / 100)));
}

async function withOptionalCouponColumns(client: SupabaseClient, coupon: CouponRow, debugTrail?: SubscriptionDebugEvent[]) {
  const { data, error } = await client.from("coupons").select(OPTIONAL_COUPON_COLUMNS).eq("id", coupon.id).maybeSingle();
  if (error) {
    logSubscriptionDebug("coupon optional columns unavailable", {
      couponId: coupon.id,
      code: coupon.code,
      requestedColumns: OPTIONAL_COUPON_COLUMNS,
      error: error.message
    }, debugTrail);
    return coupon;
  }
  logSubscriptionDebug("coupon optional query result", {
    couponId: coupon.id,
    code: coupon.code,
    found: Boolean(data),
    discountType: (data as Partial<CouponRow> | null)?.discount_type ?? null,
    discountAmount: (data as Partial<CouponRow> | null)?.discount_amount ?? null
  }, debugTrail);
  return { ...coupon, ...(data || {}) } as CouponRow;
}

async function findCouponByCode(client: SupabaseClient, couponCode: string, debugTrail?: SubscriptionDebugEvent[]) {
  const code = normalizeCouponCode(couponCode);
  const exact = await client.from("coupons").select(BASE_COUPON_COLUMNS).eq("code", code).maybeSingle();
  if (exact.error) {
    logSubscriptionDebug("coupon exact lookup failed", {
      requestedCode: code,
      selectedColumns: BASE_COUPON_COLUMNS,
      error: exact.error.message
    }, debugTrail);
    throw exact.error;
  }
  if (exact.data) {
    const coupon = await withOptionalCouponColumns(client, exact.data as CouponRow, debugTrail);
    logSubscriptionDebug("coupon exact match", {
      requestedCode: code,
      couponId: coupon.id,
      storedCode: coupon.code,
      active: coupon.active,
      expiresAt: coupon.expires_at,
      discountType: coupon.discount_type ?? "percentage",
      discountPercentage: coupon.discount_percentage,
      discountAmount: coupon.discount_amount ?? null,
      usageLimit: coupon.usage_limit,
      usedCount: coupon.used_count,
      applicableModules: "platform-wide"
    }, debugTrail);
    return coupon;
  }

  const { data, error } = await client.from("coupons").select(BASE_COUPON_COLUMNS);
  if (error) {
    logSubscriptionDebug("coupon fallback lookup failed", {
      requestedCode: code,
      selectedColumns: BASE_COUPON_COLUMNS,
      error: error.message
    }, debugTrail);
    throw error;
  }

  const rows = (Array.isArray(data) ? data : []) as CouponRow[];
  const baseCoupon = rows.find((row) => normalizeCouponCode(row.code) === code) ?? null;
  const coupon = baseCoupon ? await withOptionalCouponColumns(client, baseCoupon, debugTrail) : null;
  logSubscriptionDebug("coupon normalized fallback", {
    requestedCode: code,
    scannedRows: rows.length,
    matchedCouponId: coupon?.id ?? null,
    storedCode: coupon?.code ?? null,
    discountType: coupon?.discount_type ?? "percentage",
    discountPercentage: coupon?.discount_percentage ?? null,
    discountAmount: coupon?.discount_amount ?? null
  }, debugTrail);
  return coupon;
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

export async function getActivePlan(client: SupabaseClient, planIdOrSlug: string, debugTrail?: SubscriptionDebugEvent[]): Promise<PlanRow> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(planIdOrSlug);
  logSubscriptionDebug("plan lookup start", { lookupValue: planIdOrSlug, isUuid }, debugTrail);
  const uuidResult = isUuid
    ? await client.from("subscription_plans").select("*").eq("id", planIdOrSlug).eq("is_active", true).maybeSingle()
    : null;
  if (uuidResult?.error) throw uuidResult.error;
  let plan = uuidResult?.data ?? null;
  if (uuidResult) {
    logSubscriptionDebug("plan uuid query result", {
      lookupValue: planIdOrSlug,
      found: Boolean(plan),
      resolvedPlanId: (plan as PlanRow | null)?.id ?? null,
      resolvedPlanSlug: (plan as PlanRow | null)?.slug ?? null
    }, debugTrail);
  }

  if (!plan) {
    const lookupValues = buildPlanLookupValues(planIdOrSlug);
    const { data, error } = await client
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;

    const activePlans = (Array.isArray(data) ? data : []) as PlanRow[];
    logSubscriptionDebug("plan active query result", {
      lookupValue: planIdOrSlug,
      lookupValues,
      activePlanCount: activePlans.length,
      activePlanSlugs: activePlans.map((row) => row.slug),
      activePlanNames: activePlans.map((row) => row.name)
    }, debugTrail);
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
  billingCycle: ManualSubscriptionBillingCycle = "monthly",
  debugTrail?: SubscriptionDebugEvent[]
): Promise<PriceBreakdown> {
  const originalAmount = getPlanAmount(plan, billingCycle);
  const code = normalizeCouponCode(couponCode);

  if (!code) {
    return { originalAmount, discountAmount: 0, finalAmount: originalAmount, coupon: null };
  }

  const coupon = await findCouponByCode(client, code, debugTrail);
  if (!coupon) throw new Error("Coupon code was not found.");

  const row = validateExistingCoupon(coupon as CouponRow, new Date(), debugTrail);
  const discountAmount = calculateCouponDiscount(originalAmount, row);
  logSubscriptionDebug("coupon calculation result", {
    planId: plan.id,
    planSlug: plan.slug,
    couponId: row.id,
    couponCode: row.code,
    discountType: row.discount_type === "fixed" ? "fixed" : "percentage",
    discountPercentage: row.discount_percentage,
    discountAmountValue: row.discount_amount ?? null,
    originalAmount,
    calculatedDiscountAmount: discountAmount,
    finalAmount: Math.max(originalAmount - discountAmount, 0)
  }, debugTrail);
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
