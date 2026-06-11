import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import type { EmployerSubscriptionStatus } from "@/types/employerSubscription";

const SUBSCRIPTION_STATUSES: EmployerSubscriptionStatus[] = ["trialing", "active", "past_due", "cancelled", "expired"];

async function requireAdmin(adminClient: ReturnType<typeof createServerSupabaseClient>, token: string) {
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Invalid session.");

  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Only admins can manage employer subscriptions.");
  return authData.user;
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  try {
    const adminClient = createServerSupabaseClient();
    await requireAdmin(adminClient, token);

    const { data, error } = await adminClient
      .from("employer_subscriptions")
      .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, subscriptions: data || [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load employer subscriptions." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const subscriptionId = String(body.id || body.subscription_id || "").trim();
  const status = String(body.status || "").trim() as EmployerSubscriptionStatus;

  if (!subscriptionId || !SUBSCRIPTION_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Valid subscription id and status are required." }, { status: 400 });
  }

  try {
    const adminClient = createServerSupabaseClient();
    await requireAdmin(adminClient, token);
    const now = new Date().toISOString();
    const patch: Record<string, string | null> = { status, updated_at: now };

    if (status === "cancelled") {
      patch.cancelled_at = now;
      patch.ends_at = now;
    } else if (status === "expired") {
      patch.ends_at = now;
    } else if (status === "active" || status === "trialing" || status === "past_due") {
      patch.cancelled_at = null;
    }

    const { data, error } = await adminClient
      .from("employer_subscriptions")
      .update(patch)
      .eq("id", subscriptionId)
      .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, subscription: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update employer subscription." }, { status: 400 });
  }
}
