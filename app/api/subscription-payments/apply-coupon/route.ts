import { NextResponse } from "next/server";
import {
  calculatePaymentBreakdown,
  getActivePlan,
  normalizeManualBillingCycle,
  type SubscriptionDebugEvent
} from "@/lib/manualSubscriptionPayments";
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
  const requestPayload = { planId, planSlug, selectedPlan, couponCode, rawBillingCycle };

  debugTrail.push({ step: "request payload", details: requestPayload });

  if (!planId && !planSlug) {
    return NextResponse.json(
      includeDebug ? { error: "Invalid plan.", rejectionReason: "missing_plan", request: requestPayload, debug: debugTrail } : { error: "Invalid plan." },
      { status: 400 }
    );
  }

  if (!couponCode) {
    return NextResponse.json(
      includeDebug ? { error: "Coupon code is required.", rejectionReason: "missing_coupon", request: requestPayload, debug: debugTrail } : { error: "Coupon code is required." },
      { status: 400 }
    );
  }

  try {
    const billingCycle = normalizeManualBillingCycle(rawBillingCycle);
    const adminClient = createServerSupabaseClient();
    debugTrail.push({ step: "billing cycle normalized", details: { billingCycle } });

    let plan;
    try {
      plan = await getActivePlan(adminClient, planId || planSlug, debugTrail);
    } catch (error) {
      if (!planSlug || planSlug === planId) throw error;
      debugTrail.push({
        step: "plan_id lookup failed, retrying plan_slug",
        details: { planId, planSlug, error: error instanceof Error ? error.message : String(error) }
      });
      plan = await getActivePlan(adminClient, planSlug, debugTrail);
    }

    debugTrail.push({
      step: "subscription coupon eligibility passed",
      details: {
        module: "employer_subscriptions",
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        applicability: "platform-wide coupon, all employer subscription plans"
      }
    });

    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle, debugTrail);
    const response = { ok: true, plan, breakdown, debug: debugTrail };
    return NextResponse.json(includeDebug ? response : { ok: true, plan, breakdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not apply coupon.";
    debugTrail.push({
      step: "coupon apply rejected",
      details: { rejectionReason: message, errorName: error instanceof Error ? error.name : typeof error }
    });
    console.warn("[subscription-payments/apply-coupon] failed", { requestPayload, error: message, debugTrail });

    return NextResponse.json(
      includeDebug ? { error: message, rejectionReason: message, request: requestPayload, debug: debugTrail } : { error: message },
      { status: 400 }
    );
  }
}
