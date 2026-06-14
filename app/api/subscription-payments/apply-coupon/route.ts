import { NextResponse } from "next/server";
import { calculatePaymentBreakdown, getActivePlan, normalizeManualBillingCycle } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const planId = String(body.plan_id || body.planId || "").trim();
  const planSlug = String(body.plan_slug || body.planSlug || "").trim();
  const selectedPlan = body.selected_plan || body.selectedPlan || null;
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const rawBillingCycle = body.billing_cycle || body.billingCycle;

  if (!planId && !planSlug) {
    return NextResponse.json({ error: "Plan is required." }, { status: 400 });
  }

  try {
    const billingCycle = normalizeManualBillingCycle(rawBillingCycle);
    const adminClient = createServerSupabaseClient();
    console.info("[subscription-payments/apply-coupon] payload received", { planId, planSlug, selectedPlan, couponCode, billingCycle });
    let plan;
    try {
      plan = await getActivePlan(adminClient, planId || planSlug);
    } catch (error) {
      if (!planSlug || planSlug === planId) throw error;
      console.warn("[subscription-payments/apply-coupon] plan_id lookup failed, retrying plan_slug", {
        planId,
        planSlug,
        error: error instanceof Error ? error.message : error
      });
      plan = await getActivePlan(adminClient, planSlug);
    }
    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle);
    console.info("[subscription-payments/apply-coupon] resolved", {
      requestedPlanId: planId,
      resolvedPlanId: plan.id,
      resolvedPlanSlug: plan.slug,
      couponCode: breakdown.coupon?.code ?? null,
      originalAmount: breakdown.originalAmount,
      discountAmount: breakdown.discountAmount,
      finalAmount: breakdown.finalAmount
    });
    return NextResponse.json({ ok: true, plan, breakdown });
  } catch (error) {
    console.warn("[subscription-payments/apply-coupon] failed", {
      planId,
      planSlug,
      couponCode,
      billingCycle: rawBillingCycle,
      error: error instanceof Error ? error.message : error
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not apply coupon." }, { status: 400 });
  }
}
