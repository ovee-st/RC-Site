import { NextResponse } from "next/server";
import { calculatePaymentBreakdown, getActivePlan, normalizeManualBillingCycle, type SubscriptionDebugEvent } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const debugTrail: SubscriptionDebugEvent[] = [];
  const includeDebug = process.env.NODE_ENV !== "production";
  const planId = String(body.plan_id || body.planId || "").trim();
  const planSlug = String(body.plan_slug || body.planSlug || "").trim();
  const selectedPlan = body.selected_plan || body.selectedPlan || null;
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const rawBillingCycle = body.billing_cycle || body.billingCycle;
  const requestPayload = {
    planId,
    planSlug,
    selectedPlan,
    couponCode,
    rawBillingCycle
  };
  debugTrail.push({ step: "frontend request payload", details: requestPayload });

  if (!planId && !planSlug) {
    const response = { error: "Plan is required.", rejectionReason: "missing_plan", debug: debugTrail };
    return NextResponse.json(includeDebug ? response : { error: response.error, rejectionReason: response.rejectionReason }, { status: 400 });
  }

  try {
    const billingCycle = normalizeManualBillingCycle(rawBillingCycle);
    const adminClient = createServerSupabaseClient();
    console.info("[subscription-payments/apply-coupon] payload received", { planId, planSlug, selectedPlan, couponCode, billingCycle });
    debugTrail.push({ step: "billing cycle normalized", details: { billingCycle } });
    let plan;
    try {
      plan = await getActivePlan(adminClient, planId || planSlug, debugTrail);
    } catch (error) {
      if (!planSlug || planSlug === planId) throw error;
      console.warn("[subscription-payments/apply-coupon] plan_id lookup failed, retrying plan_slug", {
        planId,
        planSlug,
        error: error instanceof Error ? error.message : error
      });
      debugTrail.push({
        step: "plan_id lookup failed, retrying plan_slug",
        details: {
          planId,
          planSlug,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      plan = await getActivePlan(adminClient, planSlug, debugTrail);
    }
    debugTrail.push({
      step: "selected plan resolved",
      details: {
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        billingType: plan.billing_type,
        monthlyPrice: plan.monthly_price,
        oneTimePrice: plan.one_time_price
      }
    });
    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle, debugTrail);
    console.info("[subscription-payments/apply-coupon] resolved", {
      requestedPlanId: planId,
      resolvedPlanId: plan.id,
      resolvedPlanSlug: plan.slug,
      couponCode: breakdown.coupon?.code ?? null,
      originalAmount: breakdown.originalAmount,
      discountAmount: breakdown.discountAmount,
      finalAmount: breakdown.finalAmount
    });
    const response = { ok: true, plan, breakdown, debug: debugTrail };
    return NextResponse.json(includeDebug ? response : { ok: true, plan, breakdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not apply coupon.";
    debugTrail.push({
      step: "coupon apply rejected",
      details: {
        rejectionReason: message,
        errorName: error instanceof Error ? error.name : typeof error
      }
    });
    console.warn("[subscription-payments/apply-coupon] failed", {
      planId,
      planSlug,
      couponCode,
      billingCycle: rawBillingCycle,
      error: message,
      debugTrail
    });
    const response = {
      error: message,
      rejectionReason: message,
      request: requestPayload,
      debug: debugTrail
    };
    return NextResponse.json(includeDebug ? response : { error: message, rejectionReason: message }, { status: 400 });
  }
}
