"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, ReceiptText, UploadCloud } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";
import { useAuth } from "@/context/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { MANUAL_PAYMENT_METHODS, PAYMENT_REFERENCE, type ManualPaymentMethod } from "@/lib/manualSubscriptionPayments";
import { EMPLOYER_PLANS, formatCurrencyBDT } from "@/lib/subscriptions";

type Breakdown = {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  coupon: { id: string; code: string; discountPercentage: number; discountType?: "percentage" | "fixed"; discountAmount?: number | null } | null;
};

function planPrice(plan: (typeof EMPLOYER_PLANS)[number]) {
  if (plan.billingType === "one-time") return plan.monthlyPrice || 0;
  return plan.monthlyPrice || 0;
}

function formatCouponMessageValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const pieces = [record.message, record.details, record.hint, record.code]
      .filter((piece): piece is string | number => typeof piece === "string" || typeof piece === "number")
      .map(String)
      .filter(Boolean);
    if (pieces.length) return pieces.join(" ");
    try {
      return JSON.stringify(record);
    } catch {
      return "";
    }
  }
  return "";
}

function getCouponErrorMessage(responsePayload: any, responseText: string, status: number) {
  const message = [
    responsePayload?.error,
    responsePayload?.rejectionReason,
    responsePayload?.message,
    responsePayload?.details?.rejectionReason,
    responseText
  ].map(formatCouponMessageValue).find(Boolean);

  if (message) return message;
  return `Coupon API returned status ${status} without a readable error message.`;
}

export default function ManualSubscriptionPaymentPage() {
  const params = useSearchParams();
  const { user: authUser, role: authRole, loading: authLoading } = useAuth();
  const selectedPlanId = params.get("plan") || "growth";
  const selectedPlan = useMemo(() => EMPLOYER_PLANS.find((plan) => plan.id === selectedPlanId) ?? EMPLOYER_PLANS[2], [selectedPlanId]);
  const [couponCode, setCouponCode] = useState("");
  const [breakdown, setBreakdown] = useState<Breakdown>(() => ({
    originalAmount: planPrice(selectedPlan),
    discountAmount: 0,
    finalAmount: planPrice(selectedPlan),
    coupon: null
  }));
  const [resolvedPlanId, setResolvedPlanId] = useState("");
  const [couponDebugResponse, setCouponDebugResponse] = useState<unknown>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderDigits, setSenderDigits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ManualPaymentMethod>("bkash");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedPayment = MANUAL_PAYMENT_METHODS[paymentMethod];
  const selectedPlanPrice = planPrice(selectedPlan);
  const isEmployer = authRole === "employer";

  function resetBreakdown() {
    setResolvedPlanId("");
    setBreakdown({
      originalAmount: selectedPlanPrice,
      discountAmount: 0,
      finalAmount: selectedPlanPrice,
      coupon: null
    });
  }

  useEffect(() => {
    setCouponCode("");
    setCouponDebugResponse(null);
    resetBreakdown();
  }, [selectedPlan.id]);

  async function getToken() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session = sessionData.session;

    if (!session && isSupabaseConfigured) {
      const refresh = await supabase.auth.refreshSession().catch((error) => ({ data: { session: null }, error }));
      session = refresh.data.session;
      console.info("[subscription-payment-ui] refresh session result", {
        hasSession: Boolean(session),
        error: refresh.error?.message || null
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.info("[subscription-payment-ui] auth state before payment submit", {
      authContextUserId: authUser?.id || null,
      authContextEmail: authUser?.email || null,
      authContextRole: authRole,
      authContextUserType: authUser?.user_metadata?.user_type || null,
      authLoading,
      supabaseConfigured: isSupabaseConfigured,
      hasSession: Boolean(session),
      sessionUserId: session?.user?.id || null,
      sessionUserRole: session?.user?.user_metadata?.role || null,
      sessionUserType: session?.user?.user_metadata?.user_type || null,
      getUserId: userData.user?.id || null,
      getUserRole: userData.user?.user_metadata?.role || null,
      getUserType: userData.user?.user_metadata?.user_type || null,
      sessionError: sessionError?.message || null,
      userError: userError?.message || null
    });

    return session?.access_token || "";
  }

  async function uploadScreenshot(token: string) {
    if (!screenshot || !isSupabaseConfigured) return null;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || "unknown";
    const path = `${userId}/${Date.now()}-${screenshot.name.replace(/[^A-Za-z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("subscription-payment-proofs").upload(path, screenshot, {
      upsert: false,
      contentType: screenshot.type || "application/octet-stream",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    } as any);
    if (error) throw error;
    return path;
  }

  async function applyCoupon() {
    setMessage("");
    setMessageTone("success");
    setCouponDebugResponse(null);
    const code = couponCode.trim();
    if (!code) {
      resetBreakdown();
      setMessageTone("error");
      setMessage("Enter a coupon code before applying.");
      return;
    }

    setApplyingCoupon(true);
    try {
      const payload = {
        plan_id: resolvedPlanId || selectedPlan.id,
        plan_slug: selectedPlan.id,
        selected_plan: selectedPlan,
        coupon_code: code,
        billing_cycle: selectedPlan.billingType === "one-time" ? "one_time" : "monthly"
      };

      const response = await fetch("/api/subscription-payments/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      let responsePayload: any = {};
      try {
        responsePayload = responseText ? JSON.parse(responseText) : {};
      } catch {
        responsePayload = { error: responseText || `Coupon API returned an empty status ${response.status} response.` };
      }
      setCouponDebugResponse({ status: response.status, ok: response.ok, body: responsePayload, raw: responseText });

      if (!response.ok) {
        resetBreakdown();
        setMessageTone("error");
        setMessage(getCouponErrorMessage(responsePayload, responseText, response.status));
        return;
      }

      if (!responsePayload.breakdown) {
        resetBreakdown();
        setMessageTone("error");
        setMessage("Coupon response did not include a price breakdown.");
        return;
      }

      if (responsePayload.plan?.id) setResolvedPlanId(responsePayload.plan.id);
      setBreakdown(responsePayload.breakdown);
      setMessageTone("success");
      setMessage(responsePayload.breakdown?.coupon ? `Coupon ${responsePayload.breakdown.coupon.code} applied successfully.` : "Coupon cleared.");
    } catch (error) {
      resetBreakdown();
      setMessageTone("error");
      setMessage(formatCouponMessageValue(error) || "Coupon request failed before reaching the API.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function submitRequest() {
    setSaving(true);
    setMessage("");
    setMessageTone("success");
    try {
      if (authLoading) throw new Error("Checking your employer account. Please try again in a moment.");
      if (!isEmployer) {
        throw new Error(`Only employers can submit subscription payment proof. Detected role: ${authRole || "guest"}.`);
      }
      const token = await getToken();
      if (!token) {
        throw new Error("Your employer account is detected, but no active Supabase session token was found. Please sign out and sign in again.");
      }
      const paymentScreenshot = await uploadScreenshot(token);
      const payload = {
        plan_id: resolvedPlanId || selectedPlan.id,
        plan_slug: selectedPlan.id,
        selected_plan: selectedPlan,
        coupon_code: breakdown.coupon?.code || couponCode.trim() || null,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        sender_last_3_digits: senderDigits,
        payment_screenshot: paymentScreenshot,
        billing_cycle: selectedPlan.billingType === "one-time" ? "one_time" : "monthly"
      };
      console.info("[subscription-payment-ui] submit payment request", {
        selectedPlan,
        payload
      });
      const response = await fetch("/api/subscription-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const responsePayload = await response.json().catch(() => ({}));
      console.info("[subscription-payment-ui] submit payment response", {
        ok: response.ok,
        status: response.status,
        responsePayload
      });
      if (!response.ok) throw new Error(responsePayload.error || "Could not submit payment request.");
      setMessageTone("success");
      setMessage("Payment request submitted successfully. MXVL admin will verify it shortly.");
      setTransactionId("");
      setSenderDigits("");
      setScreenshot(null);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Could not submit payment request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg py-10 dark:bg-slate-950">
      <Container>
        <div className="mb-6">
          <Badge variant="primary" className="type-label text-primary">Manual Payment</Badge>
          <h1 className="type-h1 mt-3">MXVL subscription payment</h1>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-md p-6">
            <h2 className="text-xl font-black text-text-main dark:text-white">Selected Plan</h2>
            <p className="mt-2 text-2xl font-black text-primary">{selectedPlan.name}</p>
            <p className="mt-2 text-sm font-bold text-text-muted">{selectedPlan.tagline}</p>
            <div className="mt-5 rounded-md bg-primary/10 p-4">
              <p className="text-sm font-black text-text-main dark:text-white">Plan Price</p>
              <p className="mt-1 text-2xl font-black text-primary">{formatCurrencyBDT(breakdown.originalAmount)}</p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-black text-text-main dark:text-white">Coupon Code</label>
              <div className="mt-2 flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(event) => {
                    const nextCode = event.target.value.toUpperCase();
                    setCouponCode(nextCode);
                    if (breakdown.coupon && nextCode.trim() !== breakdown.coupon.code) resetBreakdown();
                  }}
                  placeholder="WELCOME20"
                />
                <Button type="button" onClick={applyCoupon} disabled={applyingCoupon}>{applyingCoupon ? "Applying..." : "Apply Coupon"}</Button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-md border border-border p-4 text-sm font-bold dark:border-white/10">
              <div className="flex justify-between"><span>Original Amount</span><span>{formatCurrencyBDT(breakdown.originalAmount)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrencyBDT(breakdown.discountAmount)}</span></div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-black dark:border-white/10"><span>Final Amount</span><span>{formatCurrencyBDT(breakdown.finalAmount)}</span></div>
            </div>
          </Card>

          <Card className="rounded-md p-6">
            <div className="flex items-center gap-3">
              <ReceiptText className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black text-text-main dark:text-white">Payment Instructions</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(MANUAL_PAYMENT_METHODS).map(([key, method]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key as ManualPaymentMethod)}
                  className={`rounded-md border px-4 py-3 text-left text-sm font-black transition ${
                    paymentMethod === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-text-main hover:border-primary/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  }`}
                >
                  {method.label}
                  <span className="mt-1 block text-xs font-bold text-text-muted">{method.number}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-md bg-slate-50 p-4 text-sm font-bold text-text-main dark:bg-white/5 dark:text-white">
              <p>Selected Method: <span className="text-primary">{selectedPayment.label}</span></p>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white p-3 dark:bg-slate-950">
                <span>{selectedPayment.label} Personal Number: <span className="text-primary">{selectedPayment.number}</span></span>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2 px-3 py-2"
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedPayment.number);
                    setMessage(`${selectedPayment.label} number copied.`);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p>Amount: <span className="text-primary">{formatCurrencyBDT(breakdown.finalAmount)}</span></p>
              <p>Reference: <span className="text-primary">{PAYMENT_REFERENCE}</span></p>
              <div className="mt-2 grid gap-2 border-t border-border pt-3 dark:border-white/10">
                <p>Step 1: Send the exact amount to the selected number.</p>
                <p>Step 2: Enter the transaction ID.</p>
                <p>Step 3: Enter the last 3 digits of the sender number.</p>
                <p>Step 4: Submit the request for verification.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <Input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Transaction ID" />
              <Input value={senderDigits} onChange={(event) => setSenderDigits(event.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="Last 3 digits of sender number" />
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 text-sm font-bold text-text-muted dark:border-white/10">
                <UploadCloud className="h-5 w-5 text-primary" />
                <span>{screenshot ? screenshot.name : "Optional screenshot upload"}</span>
                <input className="hidden" type="file" accept="image/*" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} />
              </label>
              <Button type="button" onClick={submitRequest} disabled={saving} className="justify-center">
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
              {process.env.NODE_ENV !== "production" ? (
                <p className="text-xs font-bold text-text-muted">
                  Auth debug: role={authRole || "guest"}, user={authUser?.id || "none"}, type={authUser?.user_metadata?.user_type || "none"}
                </p>
              ) : null}
            </div>

            {process.env.NODE_ENV !== "production" && couponDebugResponse ? (
              <pre className="mt-5 max-h-80 overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs font-bold text-white dark:border-white/10">
                {JSON.stringify(couponDebugResponse, null, 2)}
              </pre>
            ) : null}

            {message ? (
              <div className={`mt-5 flex gap-2 rounded-md p-4 text-sm font-bold ${
                messageTone === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger dark:text-red-300"
              }`}>
                <CheckCircle2 className="h-5 w-5" />
                {message}
              </div>
            ) : null}
          </Card>
        </div>
      </Container>
    </main>
  );
}
