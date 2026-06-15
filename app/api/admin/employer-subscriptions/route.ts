import { NextResponse } from "next/server";
import { calculateExpiryDate, getActivePlan } from "@/lib/manualSubscriptionPayments";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { ensureRoleRecord } from "@/lib/authUserSync";
import type { EmployerSubscriptionStatus } from "@/types/employerSubscription";

const SUBSCRIPTION_STATUSES: EmployerSubscriptionStatus[] = ["trialing", "active", "past_due", "cancelled", "expired"];
const OPTIONAL_DATE_COLUMNS = new Set(["start_date", "expiry_date"]);

function isOptionalDateColumnError(error: unknown) {
  const message = String((error as { message?: string; details?: string; hint?: string; code?: string } | null)?.message || "");
  const details = String((error as { details?: string } | null)?.details || "");
  const hint = String((error as { hint?: string } | null)?.hint || "");
  const combined = `${message} ${details} ${hint}`.toLowerCase();
  return /column|schema cache|pgrst204/.test(combined) && [...OPTIONAL_DATE_COLUMNS].some((column) => combined.includes(column));
}

function withoutOptionalDateColumns(patch: Record<string, string | null>) {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => !OPTIONAL_DATE_COLUMNS.has(key))) as Record<string, string | null>;
}

async function resolveEmployerRecord(
  adminClient: ReturnType<typeof createServerSupabaseClient>,
  employerId: string,
  employerUserId: string
) {
  const candidateIds = Array.from(new Set([employerId, employerUserId].filter(Boolean)));

  for (const id of candidateIds) {
    const { data } = await adminClient.from("employers").select("id, user_id").eq("id", id).maybeSingle();
    if (data?.id) return data;
  }

  for (const id of candidateIds) {
    const { data } = await adminClient.from("employers").select("id, user_id").eq("user_id", id).maybeSingle();
    if (data?.id) return data;
  }

  for (const id of candidateIds) {
    const { data: profile } = await adminClient.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!profile?.id) continue;

    await ensureRoleRecord(adminClient, { ...profile, role: "employer" });

    const { data: employer } = await adminClient.from("employers").select("id, user_id").eq("user_id", profile.id).maybeSingle();
    if (employer?.id) return employer;
  }

  return null;
}

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
  const requestedStatus = String(body.status || "").trim() as EmployerSubscriptionStatus;
  const planIdOrSlug = String(body.plan_id || body.planId || body.plan_slug || body.planSlug || "").trim();
  const employerId = String(body.employer_id || body.employerId || "").trim();
  const employerUserId = String(body.employer_user_id || body.employerUserId || "").trim();

  if (!subscriptionId && !employerId && !employerUserId) {
    return NextResponse.json({ error: "Subscription id or employer id is required." }, { status: 400 });
  }

  if (requestedStatus && !SUBSCRIPTION_STATUSES.includes(requestedStatus)) {
    return NextResponse.json({ error: "Valid subscription status is required." }, { status: 400 });
  }

  if (!requestedStatus && !planIdOrSlug) {
    return NextResponse.json({ error: "Plan or status is required." }, { status: 400 });
  }

  try {
    const adminClient = createServerSupabaseClient();
    await requireAdmin(adminClient, token);
    const now = new Date().toISOString();
    const plan = planIdOrSlug ? await getActivePlan(adminClient, planIdOrSlug) : null;
    const status = requestedStatus || "active";
    const patch: Record<string, string | null> = { status, updated_at: now };

    if (plan) {
      const start = new Date();
      const billingCycle = plan.billing_type === "one_time" ? "one_time" : "monthly";
      const expiry = calculateExpiryDate(plan, start, billingCycle);
      patch.plan_id = plan.id;
      patch.billing_cycle = billingCycle;
      patch.starts_at = start.toISOString();
      patch.ends_at = expiry.toISOString();
      patch.renews_at = plan.billing_type === "one_time" ? null : expiry.toISOString();
      patch.start_date = start.toISOString().slice(0, 10);
      patch.expiry_date = expiry.toISOString().slice(0, 10);
    }

    if (status === "cancelled") {
      patch.cancelled_at = now;
      patch.ends_at = now;
    } else if (status === "expired") {
      patch.ends_at = now;
    } else if (status === "active" || status === "trialing" || status === "past_due") {
      patch.cancelled_at = null;
    }

    let existingSubscriptionId = subscriptionId;
    let resolvedEmployerId = employerId;
    let resolvedEmployerUserId = employerUserId;

    if (!existingSubscriptionId) {
      const employer = await resolveEmployerRecord(adminClient, resolvedEmployerId, resolvedEmployerUserId);
      if (!employer?.id) throw new Error("Employer profile was not found.");
      resolvedEmployerId = employer.id;
      resolvedEmployerUserId = employer.user_id || resolvedEmployerUserId;

      const { data: latestSubscription } = await adminClient
        .from("employer_subscriptions")
        .select("id")
        .eq("employer_id", resolvedEmployerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      existingSubscriptionId = latestSubscription?.id || "";
    }

    let data;
    let error;

    if (existingSubscriptionId) {
      let result = await adminClient
        .from("employer_subscriptions")
        .update(patch)
        .eq("id", existingSubscriptionId)
        .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
        .single();
      if (result.error && isOptionalDateColumnError(result.error)) {
        result = await adminClient
          .from("employer_subscriptions")
          .update(withoutOptionalDateColumns(patch))
          .eq("id", existingSubscriptionId)
          .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
          .single();
      }
      data = result.data;
      error = result.error;
    } else {
      if (!plan) throw new Error("A plan is required to create an employer subscription.");
      const insertPayload = {
        employer_id: resolvedEmployerId,
        employer_user_id: resolvedEmployerUserId || null,
        ...patch
      };
      let result = await adminClient
        .from("employer_subscriptions")
        .insert(insertPayload)
        .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
        .single();
      if (result.error && isOptionalDateColumnError(result.error)) {
        result = await adminClient
          .from("employer_subscriptions")
          .insert({
            employer_id: resolvedEmployerId,
            employer_user_id: resolvedEmployerUserId || null,
            ...withoutOptionalDateColumns(patch)
          })
          .select("*, employers(id, user_id, company_name, email, official_email), subscription_plans(*)")
          .single();
      }
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    if (plan && data?.id) {
      await adminClient.from("employer_usage").insert({
        employer_id: data.employer_id,
        subscription_id: data.id,
        period_start: data.starts_at,
        period_end: data.ends_at || data.renews_at
      }).then(() => null);
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update employer subscription." }, { status: 400 });
  }
}
