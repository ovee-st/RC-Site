import { NextResponse } from "next/server";
import { crmErrorResponse, requireTalentCrmRequester } from "@/lib/crm/server";
import type { TalentCrmMetrics } from "@/types/talentCrm";

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const result = await context.client.rpc("crm_talent_metrics", { target_owner: context.workspaceOwnerId });
    if (result.error) throw result.error;
    if (!result.data || typeof result.data !== "object") throw new Error("Talent CRM analytics returned an invalid response.");
    return NextResponse.json({ metrics: result.data as TalentCrmMetrics });
  } catch (error) { return crmErrorResponse(error, "Could not load Talent CRM analytics."); }
}
