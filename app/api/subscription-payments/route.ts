import { NextResponse } from "next/server";
import {
  assertValidSenderDigits,
  assertValidTransactionId,
  calculatePaymentBreakdown,
  getActivePlan,
  MANUAL_PAYMENT_METHODS,
  normalizeManualBillingCycle,
  normalizeManualPaymentMethod
} from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function getEmployerContext(adminClient: ReturnType<typeof createServerSupabaseClient>, token: string) {
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Invalid session.");

  const { data: employer } = await adminClient
    .from("employers")
    .select("id, user_id, company_name, official_email, email")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!employer?.id) throw new Error("Complete your employer profile before requesting a subscription upgrade.");
  return { user: authData.user, employer };
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  try {
    const adminClient = createServerSupabaseClient();
    const { employer } = await getEmployerContext(adminClient, token);
    const { data, error } = await adminClient
      .from("subscription_payment_requests")
      .select("*, subscription_plans(*)")
      .eq("employer_id", employer.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, requests: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load payment requests." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const planId = String(body.plan_id || body.planId || "").trim();
  const planSlug = String(body.plan_slug || body.planSlug || "").trim();
  const selectedPlan = body.selected_plan || body.selectedPlan || null;
  const couponCode = String(body.coupon_code || body.couponCode || "").trim();
  const transactionId = String(body.transaction_id || body.transactionId || "").trim();
  const senderLast3Digits = String(body.sender_last_3_digits || body.senderLast3Digits || "").trim();
  const paymentScreenshot = String(body.payment_screenshot || body.paymentScreenshot || "").trim() || null;
  const paymentMethod = normalizeManualPaymentMethod(body.payment_method || body.paymentMethod);
  const rawBillingCycle = body.billing_cycle || body.billingCycle;

  try {
    if (!planId && !planSlug) throw new Error("Plan is required.");
    const billingCycle = normalizeManualBillingCycle(rawBillingCycle);
    assertValidTransactionId(transactionId);
    assertValidSenderDigits(senderLast3Digits);

    const adminClient = createServerSupabaseClient();
    const { user, employer } = await getEmployerContext(adminClient, token);
    console.info("[subscription-payments/create] payload received", {
      employerId: employer.id,
      planId,
      planSlug,
      selectedPlan,
      couponCode,
      billingCycle,
      paymentMethod
    });
    let plan;
    try {
      plan = await getActivePlan(adminClient, planId || planSlug);
    } catch (error) {
      if (!planSlug || planSlug === planId) throw error;
      console.warn("[subscription-payments/create] plan_id lookup failed, retrying plan_slug", {
        planId,
        planSlug,
        error: error instanceof Error ? error.message : error
      });
      plan = await getActivePlan(adminClient, planSlug);
    }
    const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle);
    console.info("[subscription-payments/create] resolved", {
      employerId: employer.id,
      requestedPlanId: planId,
      resolvedPlanId: plan.id,
      resolvedPlanSlug: plan.slug,
      couponId: breakdown.coupon?.id ?? null,
      couponCode: breakdown.coupon?.code ?? null,
      originalAmount: breakdown.originalAmount,
      discountAmount: breakdown.discountAmount,
      finalAmount: breakdown.finalAmount
    });

    const duplicate = await adminClient
      .from("subscription_payment_requests")
      .select("id")
      .eq("transaction_id", transactionId)
      .maybeSingle();
    if (duplicate.data?.id) throw new Error("This transaction ID has already been submitted.");

    const active = await adminClient
      .from("subscription_payment_requests")
      .select("id")
      .eq("employer_id", employer.id)
      .eq("plan_id", plan.id)
      .in("status", ["pending", "more_info"])
      .maybeSingle();
    if (active.data?.id) throw new Error("You already have an active payment request for this plan.");

    const { data: requestRow, error } = await adminClient
      .from("subscription_payment_requests")
      .insert({
        employer_id: employer.id,
        plan_id: plan.id,
        coupon_id: breakdown.coupon?.id || null,
        coupon_code: breakdown.coupon?.code || null,
        original_amount: breakdown.originalAmount,
        discount_amount: breakdown.discountAmount,
        final_amount: breakdown.finalAmount,
        payment_method: MANUAL_PAYMENT_METHODS[paymentMethod].storageValue,
        transaction_id: transactionId,
        sender_last_3_digits: senderLast3Digits,
        payment_screenshot: paymentScreenshot,
        status: "pending",
        submitted_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (error) throw error;

    await adminClient.from("notifications").insert({
      user_id: user.id,
      type: "subscription_payment_submitted",
      title: "Payment request submitted",
      message: "Your MXVL subscription payment is pending admin verification.",
      is_read: false
    });

    await adminClient.from("email_notifications").insert({
      user_id: user.id,
      recipient_email: user.email || employer.official_email || employer.email || "billing@mxventurelab.com",
      subject: "MXVL payment request submitted",
      body: "Your MXVL subscription payment request is pending admin verification.",
      related_table: "subscription_payment_requests",
      related_id: requestRow.id
    });

    return NextResponse.json({ ok: true, request: requestRow, breakdown });
  } catch (error) {
    console.warn("[subscription-payments/create] failed", {
      planId,
      planSlug,
      couponCode,
      billingCycle: rawBillingCycle,
      paymentMethod,
      error: error instanceof Error ? error.message : error
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit payment request." }, { status: 400 });
  }
}
