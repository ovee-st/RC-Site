import { NextResponse } from "next/server";
import { calculateExpiryDate, calculatePaymentBreakdown, normalizeManualBillingCycle, recordCouponUsage } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ADMIN_PAGE_SIZE = 25;
const PAYMENT_REQUEST_SELECT = [
  "id",
  "employer_id",
  "plan_id",
  "coupon_id",
  "coupon_code",
  "original_amount",
  "discount_amount",
  "final_amount",
  "payment_method",
  "transaction_id",
  "sender_last_3_digits",
  "payment_screenshot",
  "status",
  "submitted_at",
  "approved_at",
  "approved_by",
  "remarks",
  "created_at",
  "updated_at",
  "employers(id, user_id, company_name, email, official_email)",
  "subscription_plans(id, slug, name, billing_type, monthly_price, one_time_price, access_days)",
  "coupons(id, coupon_name, code, discount_type, discount_percentage, discount_amount, active, expires_at, usage_limit, used_count)"
].join(", ");

const PAYMENT_REQUEST_WITH_PLAN_SELECT = [
  "id",
  "employer_id",
  "plan_id",
  "coupon_id",
  "coupon_code",
  "original_amount",
  "discount_amount",
  "final_amount",
  "payment_method",
  "transaction_id",
  "sender_last_3_digits",
  "payment_screenshot",
  "status",
  "submitted_at",
  "approved_at",
  "approved_by",
  "remarks",
  "created_at",
  "updated_at",
  "employers(id, user_id, company_name, email, official_email)",
  "subscription_plans(id, slug, name, billing_type, monthly_price, one_time_price, access_days)"
].join(", ");

async function requireAdmin(adminClient: ReturnType<typeof createServerSupabaseClient>, token: string) {
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Invalid session.");

  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can manage subscription payments.");
  return authData.user;
}

async function createPaymentScreenshotUrl(adminClient: ReturnType<typeof createServerSupabaseClient>, requestId: string) {
  const { data: row, error } = await adminClient
    .from("subscription_payment_requests")
    .select("payment_screenshot")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw error;
  const screenshotPath = String(row?.payment_screenshot || "").trim();
  if (!screenshotPath) throw new Error("Payment screenshot was not found.");
  if (/^https?:\/\//i.test(screenshotPath)) return screenshotPath;
  const { data, error: signedUrlError } = await adminClient.storage
    .from("subscription-payment-proofs")
    .createSignedUrl(screenshotPath, 60 * 10);
  if (signedUrlError || !data?.signedUrl) throw signedUrlError || new Error("Could not open payment screenshot.");
  return data.signedUrl;
}

export async function GET(request: Request) {
  const startedAt = performance.now();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  try {
    const adminClient = createServerSupabaseClient();
    await requireAdmin(adminClient, token);
    const { searchParams } = new URL(request.url);
    const screenshotId = searchParams.get("screenshot_id");
    if (screenshotId) {
      const signedUrl = await createPaymentScreenshotUrl(adminClient, screenshotId);
      return NextResponse.json({ ok: true, signedUrl });
    }
    const status = searchParams.get("status");
    let query = adminClient
      .from("subscription_payment_requests")
      .select(PAYMENT_REQUEST_SELECT)
      .order("submitted_at", { ascending: false })
      .range(0, ADMIN_PAGE_SIZE - 1);
    if (status && status !== "all") query = query.eq("status", status);
    const queryStartedAt = performance.now();
    const { data, error } = await query;
    const queryDuration = performance.now() - queryStartedAt;
    if (error) throw error;
    console.info(`[admin-subscription-payments] payment_requests query completed in ${queryDuration.toFixed(1)}ms (${(data || []).length} rows)`);
    const response = NextResponse.json({ ok: true, requests: data || [] });
    response.headers.set("Server-Timing", [
      `admin-subscription-payments;dur=${(performance.now() - startedAt).toFixed(1)}`,
      `payment-requests;dur=${queryDuration.toFixed(1)}`
    ].join(", "));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load subscription payments." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.id || body.request_id || "").trim();
  const action = String(body.action || "").trim() as "validate_coupon" | "approved" | "rejected" | "more_info";
  const remarks = String(body.remarks || "").trim();

  if (!requestId || !["validate_coupon", "approved", "rejected", "more_info"].includes(action)) {
    return NextResponse.json({ error: "Valid request id and action are required." }, { status: 400 });
  }

  try {
    const adminClient = createServerSupabaseClient();
    const adminUser = await requireAdmin(adminClient, token);
    const { data: paymentRequestRow, error: requestError } = await adminClient
      .from("subscription_payment_requests")
      .select(PAYMENT_REQUEST_WITH_PLAN_SELECT)
      .eq("id", requestId)
      .maybeSingle();
    if (requestError || !paymentRequestRow) throw new Error("Payment request not found.");
    const paymentRequest = paymentRequestRow as any;

    if (action === "validate_coupon") {
      const couponCode = String(body.coupon_code || paymentRequest.coupon_code || "").trim();
      if (!couponCode) throw new Error("No coupon code was submitted with this payment request.");

      const plan = paymentRequest.subscription_plans;
      if (!plan) throw new Error("Selected subscription plan was not found.");
      const billingCycle = normalizeManualBillingCycle(plan.billing_type === "one_time" ? "one_time" : "monthly");
      const breakdown = await calculatePaymentBreakdown(adminClient, plan, couponCode, billingCycle);

      const { data, error } = await adminClient
        .from("subscription_payment_requests")
        .update({
          coupon_id: breakdown.coupon?.id || null,
          coupon_code: breakdown.coupon?.code || couponCode,
          original_amount: breakdown.originalAmount,
          discount_amount: breakdown.discountAmount,
          final_amount: breakdown.finalAmount,
          remarks: remarks || `Coupon ${breakdown.coupon?.code || couponCode} validated by admin.`,
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId)
        .select(PAYMENT_REQUEST_SELECT)
        .single();
      if (error) throw error;

      await adminClient.from("subscription_payment_approval_logs").insert({
        payment_request_id: requestId,
        admin_user_id: adminUser.id,
        action: "more_info",
        notes: `Coupon validated: ${breakdown.coupon?.code || couponCode}. Discount: ${breakdown.discountAmount}.`
      });

      return NextResponse.json({ ok: true, request: data, breakdown });
    }

    if (action !== "approved") {
      const { data, error } = await adminClient
        .from("subscription_payment_requests")
        .update({ status: action, remarks, updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .select(PAYMENT_REQUEST_SELECT)
        .single();
      if (error) throw error;

      await adminClient.from("subscription_payment_approval_logs").insert({ payment_request_id: requestId, admin_user_id: adminUser.id, action, notes: remarks });
      await adminClient.from("notifications").insert({
        user_id: paymentRequest.employers?.user_id,
        type: action === "rejected" ? "subscription_payment_rejected" : "subscription_payment_more_info",
        title: action === "rejected" ? "Subscription payment rejected" : "More payment information required",
        message: remarks || (action === "rejected" ? "Your payment request was rejected." : "MXVL needs more information to verify your payment."),
        is_read: false
      });
      await adminClient.from("email_notifications").insert({
        user_id: paymentRequest.employers?.user_id,
        recipient_email: paymentRequest.employers?.official_email || paymentRequest.employers?.email || "billing@mxventurelab.com",
        subject: action === "rejected" ? "MXVL subscription payment rejected" : "More information required for MXVL subscription payment",
        body: remarks || (action === "rejected" ? "Your payment request was rejected." : "MXVL needs more information to verify your payment."),
        related_table: "subscription_payment_requests",
        related_id: requestId
      });

      return NextResponse.json({ ok: true, request: data });
    }

    const plan = paymentRequest.subscription_plans;
    const start = new Date();
    const billingCycle = plan.billing_type === "one_time" ? "one_time" : "monthly";
    const expiry = calculateExpiryDate(plan, start, billingCycle);
    const originalAmount = body.original_amount !== undefined ? Number(body.original_amount) : Number(paymentRequest.original_amount || 0);
    const discountAmount = body.discount_amount !== undefined ? Number(body.discount_amount) : Number(paymentRequest.discount_amount || 0);
    const finalAmount = body.final_amount !== undefined ? Number(body.final_amount) : Number(paymentRequest.final_amount || 0);

    if (![originalAmount, discountAmount, finalAmount].every(Number.isFinite) || originalAmount < 0 || discountAmount < 0 || finalAmount < 0) {
      throw new Error("Approved payment amounts must be valid non-negative numbers.");
    }

    await adminClient
      .from("employer_subscriptions")
      .update({ status: "expired", ends_at: start.toISOString(), expiry_date: start.toISOString().slice(0, 10) })
      .eq("employer_id", paymentRequest.employer_id)
      .in("status", ["trialing", "active", "past_due"]);

    const { data: subscription, error: subscriptionError } = await adminClient
      .from("employer_subscriptions")
      .insert({
        employer_id: paymentRequest.employer_id,
        employer_user_id: paymentRequest.employers?.user_id || null,
        plan_id: paymentRequest.plan_id,
        status: "active",
        billing_cycle: billingCycle,
        starts_at: start.toISOString(),
        ends_at: expiry.toISOString(),
        renews_at: plan.billing_type === "one_time" ? null : expiry.toISOString(),
        start_date: start.toISOString().slice(0, 10),
        expiry_date: expiry.toISOString().slice(0, 10)
      })
      .select("id")
      .single();
    if (subscriptionError) throw subscriptionError;

    await adminClient.from("employer_usage").insert({
      employer_id: paymentRequest.employer_id,
      subscription_id: subscription.id,
      period_start: start.toISOString(),
      period_end: expiry.toISOString()
    });

    const invoiceNumber = `MXVL-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`;
    await adminClient.from("subscription_invoices").insert({
      payment_request_id: paymentRequest.id,
      employer_id: paymentRequest.employer_id,
      subscription_id: subscription.id,
      invoice_number: invoiceNumber,
      amount: finalAmount,
      status: "paid"
    });

    await adminClient.from("transactions").insert({
      user_id: paymentRequest.employers?.user_id || null,
      user_email: paymentRequest.employers?.official_email || paymentRequest.employers?.email || null,
      amount: finalAmount,
      payment_method: "bKash Manual",
      coupon_used: paymentRequest.coupon_code || null,
      transaction_id: paymentRequest.transaction_id,
      status: "paid"
    });

    if (paymentRequest.coupon_id) {
      await recordCouponUsage(adminClient, paymentRequest.coupon_id);
    }

    const { data: updatedRequest, error: updateError } = await adminClient
      .from("subscription_payment_requests")
      .update({
        status: "approved",
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        approved_at: start.toISOString(),
        approved_by: adminUser.id,
        remarks,
        updated_at: start.toISOString()
      })
      .eq("id", requestId)
      .select(PAYMENT_REQUEST_SELECT)
      .single();
    if (updateError) throw updateError;

    await adminClient.from("subscription_payment_approval_logs").insert({ payment_request_id: requestId, admin_user_id: adminUser.id, action: "approved", notes: remarks });
    await adminClient.from("notifications").insert({
      user_id: paymentRequest.employers?.user_id,
      type: "subscription_payment_approved",
      title: "Subscription activated",
      message: `Your ${plan.name} subscription is active until ${expiry.toLocaleDateString("en-GB")}.`,
      is_read: false
    });
    await adminClient.from("email_notifications").insert({
      user_id: paymentRequest.employers?.user_id,
      recipient_email: paymentRequest.employers?.official_email || paymentRequest.employers?.email || "billing@mxventurelab.com",
      subject: "MXVL subscription activated",
      body: `Your ${plan.name} subscription is active until ${expiry.toLocaleDateString("en-GB")}. Invoice: ${invoiceNumber}.`,
      related_table: "subscription_payment_requests",
      related_id: requestId
    });

    return NextResponse.json({ ok: true, request: updatedRequest, subscription, invoiceNumber });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update payment request." }, { status: 400 });
  }
}
