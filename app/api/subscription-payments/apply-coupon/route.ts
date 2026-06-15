import { NextResponse } from "next/server";
import {
  buildPlanFromSelectedPlan,
  calculatePaymentBreakdown,
  getActivePlan,
  normalizeManualBillingCycle,
  type SubscriptionDebugEvent
} from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const APPLY_COUPON_DIAGNOSTIC_VERSION = "2026-06-14-coupon-apply-v3";

function formatUnknownError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const pieces = [record.message, record.details, record.hint, record.code]
      .filter((piece): piece is string | number => typeof piece === "string" || typeof piece === "number")
      .map(String)
      .filter(Boolean);
    if (pieces.length) return pieces.join(" ");
    try {
      return JSON.stringify(record);
    } catch {
      return "Coupon API failed with an unreadable object error.";
    }
  }
  return "Coupon API failed before returning details.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const debugTrail: SubscriptionDebugEvent[] = [];
  const includeDebug = true;
  const planId = String(body.plan_id || body.planId || "").trim();
  const planSlug = String(body.plan_slug || body.planSlug || "").trim();
  const selectedPlan = body.selected_plan || body.selectedPlan || null;
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const rawBillingCycle = body.billing_cycle || body.billingCycle;
  const requestPayload = { planId, planSlug, selectedPlan, couponCode, rawBillingCycle };

  debugTrail.push({ step: "request payload", details: { ...requestPayload, diagnosticVersion: APPLY_COUPON_DIAGNOSTIC_VERSION } });

  if (!planId && !planSlug) {
    return NextResponse.json(
      { ok: false, error: "Invalid plan.", rejectionReason: "missing_plan", request: requestPayload, debug: debugTrail, diagnosticVersion: APPLY_COUPON_DIAGNOSTIC_VERSION },
      { status: 400 }
    );
  }

  if (!couponCode) {
    return NextResponse.json(
      { ok: false, error: "Coupon code is required.", rejectionReason: "missing_coupon", request: requestPayload, debug: debugTrail, diagnosticVersion: APPLY_COUPON_DIAGNOSTIC_VERSION },
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
      debugTrail.push({
        step: "plan lookup failed",
        details: { planId, planSlug, error: formatUnknownError(error) }
      });
      if (planSlug && planSlug !== planId) {
        try {
          debugTrail.push({ step: "retrying plan lookup with slug", details: { planSlug } });
          plan = await getActivePlan(adminClient, planSlug, debugTrail);
        } catch (slugError) {
          debugTrail.push({
            step: "plan slug lookup failed",
            details: { planSlug, error: formatUnknownError(slugError) }
          });
        }
      }

      if (!plan) {
        plan = buildPlanFromSelectedPlan(selectedPlan, planSlug || planId);
        debugTrail.push({
          step: "selected plan fallback result",
          details: {
            found: Boolean(plan),
            planId: plan?.id ?? null,
            planSlug: plan?.slug ?? null,
            planName: plan?.name ?? null,
            reason: "Used selected plan payload because subscription_plans lookup failed."
          }
        });
      }

      if (!plan) throw error;
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
    const response = { ok: true, plan, breakdown, debug: debugTrail, diagnosticVersion: APPLY_COUPON_DIAGNOSTIC_VERSION };
    return NextResponse.json(includeDebug ? response : { ok: true, plan, breakdown });
  } catch (error) {
    const message = formatUnknownError(error);
    debugTrail.push({
      step: "coupon apply rejected",
      details: { rejectionReason: message, errorName: error instanceof Error ? error.name : typeof error }
    });
    console.warn("[subscription-payments/apply-coupon] failed", { requestPayload, error: message, debugTrail });

    return NextResponse.json(
      { ok: false, error: message, rejectionReason: message, request: requestPayload, debug: debugTrail, diagnosticVersion: APPLY_COUPON_DIAGNOSTIC_VERSION },
      { status: 400 }
    );
  }
}
