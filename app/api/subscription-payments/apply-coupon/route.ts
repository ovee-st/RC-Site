import { NextResponse } from "next/server";
import { calculatePaymentBreakdown, getActivePlan, normalizeManualBillingCycle } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const planId = String(body.plan_id || body.planId || "").trim();
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const rawBillingCycle = body.billing_cycle || body.billingCycle;

  if (!planId) {
    return NextResponse.json({ error: "Plan is required." }, { status: 400 });
  }

  try {
    const billingCycle = normalizeManualBillingCycle(rawBillingCycle);
    const adminClient = createServerSupabaseClient();
    const plan = await getActivePlan(adminClient, planId);
    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle);
    return NextResponse.json({ ok: true, plan, breakdown });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not apply coupon." }, { status: 400 });
  }
}
