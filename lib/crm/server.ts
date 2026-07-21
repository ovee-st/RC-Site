import { NextResponse } from "next/server";
import { atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, requireAtsRequester, type AtsRequester } from "@/lib/ats/server";

export { atsRateResponse as crmRateResponse, cleanText, enforceAtsWriteRate as enforceCrmWriteRate, isUuid };
export type TalentCrmRequester = AtsRequester;

export async function requireTalentCrmRequester(request: Request, write = false) {
  return requireAtsRequester(request, write, "pipeline");
}

export function crmErrorResponse(error: unknown, fallback = "Talent CRM request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const setupRequired = /talent_pools|talent_pool_members|employer_contacts|employee_referrals|career_pages|offer_templates|talent_messages|schema cache|does not exist|could not find/i.test(message);
  if (process.env.NODE_ENV !== "test") console.error("[talent-crm] request failed", { message: message.slice(0, 400) });
  if (setupRequired) return NextResponse.json({ error: "The Talent CRM migration must be applied before using this feature.", code: "TALENT_CRM_SETUP_REQUIRED" }, { status: 503 });
  return atsErrorResponse(error, fallback);
}

export async function requireOwnedPool(context: TalentCrmRequester, poolId: string) {
  if (!isUuid(poolId)) return null;
  const result = await context.client.from("talent_pools").select("id,employer_user_id,name,is_archived").eq("id", poolId).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
