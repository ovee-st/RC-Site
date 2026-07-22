import { NextResponse } from "next/server";
import { atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, requireAtsRequester, type AtsRequester } from "@/lib/ats/server";
import { logger } from "@/lib/observability/logger";
import { parseCrmSchemaDiagnostic } from "@/lib/crm/schema";

export { atsRateResponse as crmRateResponse, cleanText, enforceAtsWriteRate as enforceCrmWriteRate, isUuid };
export type TalentCrmRequester = AtsRequester;

export async function requireTalentCrmRequester(request: Request, write = false) {
  const context = await requireAtsRequester(request, write, "pipeline");
  if ("response" in context || context.role !== "admin") return context;

  const requestedOwnerId = new URL(request.url).searchParams.get("employer_user_id");
  if (!requestedOwnerId) return context;
  if (!isUuid(requestedOwnerId)) {
    return { response: NextResponse.json({ error: "A valid employer workspace is required." }, { status: 400 }) } as const;
  }
  const employer = await context.client.from("employers").select("id").eq("user_id", requestedOwnerId).limit(1).maybeSingle();
  if (employer.error) return { response: crmErrorResponse(employer.error, "Could not resolve employer workspace.") } as const;
  return { ...context, workspaceOwnerId: requestedOwnerId, employerId: employer.data?.id || null } as TalentCrmRequester;
}

export function crmErrorResponse(error: unknown, fallback = "Talent CRM request failed.") {
  const diagnostic = parseCrmSchemaDiagnostic(error);
  if (process.env.NODE_ENV !== "test") logger.error("talent_crm_request_failed", { error });
  if (diagnostic) {
    return NextResponse.json({
      error: diagnostic.message,
      code: "TALENT_CRM_SCHEMA_INCOMPLETE",
      diagnostic
    }, { status: 503 });
  }
  return atsErrorResponse(error, fallback);
}

export async function requireOwnedPool(context: TalentCrmRequester, poolId: string) {
  if (!isUuid(poolId)) return null;
  const result = await context.client.from("talent_pools").select("id,employer_user_id,name,is_archived").eq("id", poolId).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
