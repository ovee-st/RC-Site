"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, ReceiptText, UploadCloud } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";
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

export default function ManualSubscriptionPaymentPage() {
  const params = useSearchParams();
  const selectedPlanId = params.get("plan") || "growth";
  const selectedPlan = useMemo(() => EMPLOYER_PLANS.find((plan) => plan.id === selectedPlanId) ?? EMPLOYER_PLANS[2], [selectedPlanId]);
  const [couponCode, setCouponCode] = useState("");
  const [breakdown, setBreakdown] = useState<Breakdown>({
    originalAmount: planPrice(selectedPlan),
    discountAmount: 0,
    finalAmount: planPrice(selectedPlan),
    coupon: null
  });
  const [transactionId, setTransactionId] = useState("");
  const [senderDigits, setSenderDigits] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ManualPaymentMethod>("bkash");
  const [resolvedPlanId, setResolvedPlanId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedPayment = MANUAL_PAYMENT_METHODS[paymentMethod];

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  function clearAppliedDiscount() {
    setBreakdown((current) => ({
      ...current,
      discountAmount: 0,
      finalAmount: current.originalAmount,
      coupon: null
    }));
  }

  async function refreshPlanAmount() {
    const payload = {
      plan_id: selectedPlan.id,
      plan_slug: selectedPlan.id,
      selected_plan: selectedPlan,
      coupon_code: "",
      billing_cycle: selectedPlan.billingType === "one-time" ? "one_time" : "monthly"
    };
    console.info("[subscription-payment-ui] refresh plan amount", {
      selectedPlan,
      resolvedPlanId,
      payload
    });
    const response = await fetch("/api/subscription-payments/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const responsePayload = await response.json().catch(() => ({}));
    console.info("[subscription-payment-ui] refresh plan response", {
      ok: response.ok,
      status: response.status,
      responsePayload
    });
    if (response.ok && responsePayload.breakdown) {
      if (responsePayload.plan?.id) setResolvedPlanId(responsePayload.plan.id);
      setBreakdown(responsePayload.breakdown);
    } else {
      setResolvedPlanId("");
      setBreakdown({
        originalAmount: planPrice(selectedPlan),
        discountAmount: 0,
        finalAmount: planPrice(selectedPlan),
        coupon: null
      });
    }
  }

  useEffect(() => {
    setCouponCode("");
    setResolvedPlanId("");
    refreshPlanAmount();
  }, [selectedPlan.id]);

  async function applyCoupon() {
    setMessage("");
    const payload = {
      plan_id: resolvedPlanId || selectedPlan.id,
      plan_slug: selectedPlan.id,
      selected_plan: selectedPlan,
      coupon_code: couponCode,
      billing_cycle: selectedPlan.billingType === "one-time" ? "one_time" : "monthly"
    };
    console.info("[subscription-payment-ui] apply coupon request", {
      selectedPlan,
      resolvedPlanId,
      couponCode,
      payload
    });
    const response = await fetch("/api/subscription-payments/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const responsePayload = await response.json().catch(() => ({}));
    console.info("[subscription-payment-ui] apply coupon response", {
      ok: response.ok,
      status: response.status,
      responsePayload
    });
    if (!response.ok) {
      clearAppliedDiscount();
      setMessage(responsePayload.error || "Could not apply coupon.");
      return;
    }
    if (responsePayload.plan?.id) setResolvedPlanId(responsePayload.plan.id);
    setBreakdown(responsePayload.breakdown);
    setMessage(responsePayload.breakdown.coupon ? `Coupon ${responsePayload.breakdown.coupon.code} applied.` : "Coupon cleared.");
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

  async function submitRequest() {
    setSaving(true);
    setMessage("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Please sign in as an employer before submitting payment proof.");
      const paymentScreenshot = await uploadScreenshot(token);
      const payload = {
        plan_id: resolvedPlanId || selectedPlan.id,
        plan_slug: selectedPlan.id,
        selected_plan: selectedPlan,
        coupon_code: breakdown.coupon?.code || couponCode,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        sender_last_3_digits: senderDigits,
        payment_screenshot: paymentScreenshot,
        billing_cycle: selectedPlan.billingType === "one-time" ? "one_time" : "monthly"
      };
      console.info("[subscription-payment-ui] submit payment request", {
        selectedPlan,
        resolvedPlanId,
        breakdown,
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
      setMessage("Payment request submitted successfully. MXVL admin will verify it shortly.");
      setTransactionId("");
      setSenderDigits("");
      setScreenshot(null);
    } catch (error) {
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
                    if (breakdown.coupon && nextCode.trim() !== breakdown.coupon.code) clearAppliedDiscount();
                  }}
                  placeholder="WELCOME20"
                />
                <Button type="button" onClick={applyCoupon}>Apply Coupon</Button>
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
            </div>

            {message ? (
              <div className="mt-5 flex gap-2 rounded-md bg-success/10 p-4 text-sm font-bold text-success">
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
