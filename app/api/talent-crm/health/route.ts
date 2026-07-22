import { NextResponse } from "next/server";
import { requireTalentCrmRequester } from "@/lib/crm/server";
import { parseCrmSchemaDiagnostic, TALENT_CRM_SCHEMA_REQUIREMENTS, type CrmSchemaDiagnostic } from "@/lib/crm/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await requireTalentCrmRequester(request);
  if ("response" in context) return context.response;

  const checks = await Promise.all(TALENT_CRM_SCHEMA_REQUIREMENTS.map(async (requirement) => {
    const result = await context.client.from(requirement.table).select(requirement.columns.join(",")).limit(0);
    return result.error ? parseCrmSchemaDiagnostic(result.error) || {
      type: "unknown" as const,
      object: requirement.table,
      table: requirement.table,
      message: `Could not verify ${requirement.table}: ${result.error.message}`
    } : null;
  }));

  const issues = checks.filter((issue): issue is CrmSchemaDiagnostic => Boolean(issue));
  const helper = await context.client.rpc("crm_workspace_member", { target_owner: context.workspaceOwnerId });
  if (helper.error) {
    issues.push(parseCrmSchemaDiagnostic(helper.error) || {
      type: "function",
      object: "crm_workspace_member",
      message: `Could not verify function crm_workspace_member: ${helper.error.message}`
    });
  }

  const buckets = await context.client.storage.listBuckets();
  const hasDocumentBucket = !buckets.error && buckets.data.some((bucket) => bucket.id === "candidate-documents");
  if (!hasDocumentBucket) {
    issues.push({ type: "unknown", object: "candidate-documents", message: buckets.error ? `Could not verify storage bucket candidate-documents: ${buckets.error.message}` : "Missing storage bucket: candidate-documents" });
  }

  return NextResponse.json({
    healthy: issues.length === 0,
    checkedAt: new Date().toISOString(),
    checkedTables: TALENT_CRM_SCHEMA_REQUIREMENTS.map((requirement) => requirement.table),
    issues
  }, { status: issues.length ? 503 : 200 });
}
