import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { SubscriptionService } from "@/lib/subscriptionService";

async function getEmployerContext(adminClient: ReturnType<typeof createServerSupabaseClient>, token: string) {
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) throw new Error("Invalid session.");

  const { data: employer } = await adminClient
    .from("employers")
    .select("id, user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!employer?.id) throw new Error("Employer profile was not found.");
  return employer;
}

function formatRenewalDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Missing session token." }, { status: 401 });

  try {
    const adminClient = createServerSupabaseClient();
    const employer = await getEmployerContext(adminClient, token);
    const subscriptionService = new SubscriptionService(adminClient);
    const current = await subscriptionService.getCurrentPlan(employer.id);

    if (!current.plan || !current.subscription || !current.usage) {
      return NextResponse.json({ ok: true, currentPlan: current, widget: null });
    }

    return NextResponse.json({
      ok: true,
      currentPlan: current,
      widget: {
        currentPlanId: current.plan.slug,
        renewalDate: formatRenewalDate(current.subscription.renewsAt || current.subscription.endsAt),
        jobsUsed: current.usage.jobsUsed,
        jobsLimit: current.plan.jobLimit ?? "unlimited",
        candidateViewsUsed: current.usage.candidateViewsUsed,
        candidateViewsLimit: current.plan.candidateViewLimit ?? "unlimited",
        aiCreditsUsed: current.usage.aiCreditsUsed,
        aiCreditsLimit: current.plan.aiCreditLimit ?? "unlimited",
        recruiterSeatsUsed: current.usage.recruitersUsed,
        recruiterSeatsLimit: current.plan.recruiterLimit ?? "unlimited"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load employer subscription." }, { status: 400 });
  }
}
