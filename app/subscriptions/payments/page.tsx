"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Container from "@/components/layout/Container";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { formatCurrencyBDT } from "@/lib/subscriptions";

type PaymentRequest = Record<string, any>;

export default function SubscriptionPaymentStatusPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch("/api/subscription-payments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(payload.error || "Could not load payment status.");
        return;
      }
      setRequests(payload.requests || []);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-bg py-10 dark:bg-slate-950">
      <Container>
        <Badge variant="primary" className="type-label text-primary">Payment Status</Badge>
        <h1 className="type-h1 mt-3">Subscription payment requests</h1>
        {message ? <p className="mt-4 text-sm font-bold text-danger">{message}</p> : null}
        <div className="mt-6 grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="rounded-md p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-text-main dark:text-white">{request.subscription_plans?.name || "Subscription Plan"}</h2>
                    <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "danger" : "primary"}>
                      {request.status === "pending" ? "Pending Verification" : request.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold text-text-muted">Transaction ID: {request.transaction_id}</p>
                  <p className="mt-1 text-sm font-bold text-text-muted">Submitted: {new Date(request.submitted_at || request.created_at).toLocaleString()}</p>
                  {request.remarks ? <p className="mt-3 text-sm font-bold text-primary">Admin Remarks: {request.remarks}</p> : null}
                </div>
                <p className="text-2xl font-black text-primary">{formatCurrencyBDT(Number(request.final_amount || 0))}</p>
              </div>
            </Card>
          ))}
          {!requests.length ? (
            <Card className="rounded-md p-8 text-center">
              <h2 className="text-xl font-black text-text-main dark:text-white">No payment requests yet</h2>
              <p className="mt-2 text-sm font-bold text-text-muted">Upgrade a plan and submit bKash payment proof to see status here.</p>
            </Card>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
