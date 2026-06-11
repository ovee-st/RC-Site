import { NextResponse } from "next/server";
import { calculatePaymentBreakdown, getActivePlan } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const planId = String(body.plan_id || body.planId || "").trim();
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const billingCycle = body.billing_cycle === "yearly" ? "yearly" : body.billing_cycle === "one_time" ? "one_time" : "monthly";

  if (!planId) {
    return NextResponse.json({ error: "Plan is required." }, { status: 400 });
  }

  try {
    const adminClient = createServerSupabaseClient();
    const plan = await getActivePlan(adminClient, planId);
    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle);
    return NextResponse.json({ ok: true, plan, breakdown });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not apply coupon." }, { status: 400 });
  }
}
