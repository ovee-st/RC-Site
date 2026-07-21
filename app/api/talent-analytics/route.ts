import { NextResponse } from "next/server";
import { crmErrorResponse, requireTalentCrmRequester } from "@/lib/crm/server";
import { calculateTalentCrmMetrics } from "@/lib/talentCrm";

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const [pools, members, referrals, page, messages, applications] = await Promise.all([
      context.client.from("talent_pools").select("id,is_archived").eq("employer_user_id", context.workspaceOwnerId),
      context.client.from("talent_pool_members").select("id,created_at,pool_id,talent_pools!inner(employer_user_id)").eq("talent_pools.employer_user_id", context.workspaceOwnerId).limit(10_000),
      context.client.from("employee_referrals").select("id,status").eq("employer_user_id", context.workspaceOwnerId).limit(10_000),
      context.client.from("career_pages").select("id").eq("employer_user_id", context.workspaceOwnerId).maybeSingle(),
      context.client.from("talent_messages").select("id,status").eq("employer_user_id", context.workspaceOwnerId).limit(10_000),
      context.client.from("applications").select("id,status,source,employer_user_id,employer_id").or(`employer_user_id.eq.${context.workspaceOwnerId}${context.employerId ? `,employer_id.eq.${context.employerId}` : ""}`).limit(10_000)
    ]);
    for (const result of [pools, members, referrals, page, messages, applications]) if (result.error) throw new Error(result.error.message);
    const events = page.data ? await context.client.from("career_page_events").select("event_type").eq("career_page_id", page.data.id).limit(20_000) : { data: [], error: null };
    if (events.error) throw new Error(events.error.message);
    const metrics = calculateTalentCrmMetrics({ pools: pools.data || [], members: members.data || [], referrals: referrals.data || [], events: events.data || [], messages: messages.data || [], sources: (applications.data || []).map((item) => ({ source: item.source || "Direct", hired: String(item.status).toLowerCase() === "hired" })) });
    return NextResponse.json({ metrics });
  } catch (error) { return crmErrorResponse(error, "Could not load Talent CRM analytics."); }
}
