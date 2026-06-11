import { NextResponse } from "next/server";
import { calculateExpiryDate, recordCouponUsage } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

async function requireAdmin(adminClient: ReturnType<typeof createServerSupabaseClient>, token: string) {
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Invalid session.");

  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can manage subscription payments.");
  return authData.user;
}

async function attachSignedProofUrls(adminClient: ReturnType<typeof createServerSupabaseClient>, rows: any[]) {
  return Promise.all((rows || []).map(async (row) => {
    if (!row.payment_screenshot || /^https?:\/\//i.test(row.payment_screenshot)) return row;
    const { data } = await adminClient.storage
      .from("subscription-payment-proofs")
      .createSignedUrl(row.payment_screenshot, 60 * 10);
    return {
      ...row,
      payment_screenshot_url: data?.signedUrl || null
    };
  }));
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  try {
    const adminClient = createServerSupabaseClient();
    await requireAdmin(adminClient, token);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    let query = adminClient
      .from("subscription_payment_requests")
      .select("*, employers(*), subscription_plans(*), coupons(*)")
      .order("submitted_at", { ascending: false });
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, requests: await attachSignedProofUrls(adminClient, data || []) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load subscription payments." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const requestId = String(body.id || body.request_id || "").trim();
  const action = String(body.action || "").trim() as "approved" | "rejected" | "more_info";
  const remarks = String(body.remarks || "").trim();

  if (!requestId || !["approved", "rejected", "more_info"].includes(action)) {
    return NextResponse.json({ error: "Valid request id and action are required." }, { status: 400 });
  }

  try {
    const adminClient = createServerSupabaseClient();
    const adminUser = await requireAdmin(adminClient, token);
    const { data: paymentRequest, error: requestError } = await adminClient
      .from("subscription_payment_requests")
      .select("*, employers(*), subscription_plans(*)")
      .eq("id", requestId)
      .maybeSingle();
    if (requestError || !paymentRequest) throw new Error("Payment request not found.");

    if (action !== "approved") {
      const { data, error } = await adminClient
        .from("subscription_payment_requests")
        .update({ status: action, remarks, updated_at: new Date().toISOString() })
        .eq("id", requestId)
        .select("*")
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
      .select("*")
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
      amount: paymentRequest.final_amount,
      status: "paid"
    });

    await adminClient.from("transactions").insert({
      user_id: paymentRequest.employers?.user_id || null,
      user_email: paymentRequest.employers?.official_email || paymentRequest.employers?.email || null,
      amount: paymentRequest.final_amount,
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
      .update({ status: "approved", approved_at: start.toISOString(), approved_by: adminUser.id, remarks, updated_at: start.toISOString() })
      .eq("id", requestId)
      .select("*")
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
