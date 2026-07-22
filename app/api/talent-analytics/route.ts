import { NextResponse } from "next/server";
import { crmErrorResponse, requireTalentCrmRequester, type TalentCrmRequester } from "@/lib/crm/server";
import { parseCrmSchemaDiagnostic } from "@/lib/crm/schema";
import { calculateTalentCrmMetrics } from "@/lib/talentCrm";
import type { TalentCrmMetrics } from "@/types/talentCrm";

async function loadCompatibilityMetrics(context: TalentCrmRequester) {
  const [pools, members, referrals, page, messages, applications] = await Promise.all([
    context.client.from("talent_pools").select("id,is_archived").eq("employer_user_id", context.workspaceOwnerId),
    context.client.from("talent_pool_members").select("id,created_at,pool_id,talent_pools!inner(employer_user_id)").eq("talent_pools.employer_user_id", context.workspaceOwnerId).limit(10_000),
    context.client.from("employee_referrals").select("id,status").eq("employer_user_id", context.workspaceOwnerId).limit(10_000),
    context.client.from("career_pages").select("id").eq("employer_user_id", context.workspaceOwnerId).maybeSingle(),
    context.client.from("talent_messages").select("id,status").eq("employer_user_id", context.workspaceOwnerId).limit(10_000),
    context.client.from("applications").select("id,status,employer_user_id,employer_id").or(`employer_user_id.eq.${context.workspaceOwnerId}${context.employerId ? `,employer_id.eq.${context.employerId}` : ""}`).limit(10_000)
  ]);
  for (const query of [pools, members, referrals, page, messages, applications]) if (query.error) throw query.error;
  const events = page.data ? await context.client.from("career_page_events").select("event_type").eq("career_page_id", page.data.id).limit(20_000) : { data: [], error: null };
  if (events.error) throw events.error;
  const applicationIds = (applications.data || []).map((application) => application.id);
  const stages = applicationIds.length ? await context.client.from("candidate_stages").select("application_id,source").in("application_id", applicationIds).limit(10_000) : { data: [], error: null };
  if (stages.error) throw stages.error;
  const sourceByApplication = new Map((stages.data || []).map((stage) => [stage.application_id, stage.source || "Direct"]));
  return calculateTalentCrmMetrics({
    pools: pools.data || [],
    members: members.data || [],
    referrals: referrals.data || [],
    events: events.data || [],
    messages: messages.data || [],
    sources: (applications.data || []).map((application) => ({ source: sourceByApplication.get(application.id) || "Direct", hired: String(application.status).toLowerCase() === "hired" }))
  });
}

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const result = await context.client.rpc("crm_talent_metrics", { target_owner: context.workspaceOwnerId });
    if (result.error) {
      const diagnostic = parseCrmSchemaDiagnostic(result.error);
      if (diagnostic?.type === "function" && diagnostic.object === "crm_talent_metrics") {
        return NextResponse.json({ metrics: await loadCompatibilityMetrics(context), mode: "compatibility" });
      }
      throw result.error;
    }
    if (!result.data || typeof result.data !== "object") throw new Error("Talent CRM analytics returned an invalid response.");
    return NextResponse.json({ metrics: result.data as TalentCrmMetrics });
  } catch (error) { return crmErrorResponse(error, "Could not load Talent CRM analytics."); }
}
