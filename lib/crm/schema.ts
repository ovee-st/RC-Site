export type CrmSchemaRequirement = {
  table: string;
  columns: readonly string[];
  label: string;
};

export type CrmSchemaDiagnostic = {
  type: "table" | "column" | "relationship" | "function" | "unknown";
  object: string;
  table?: string;
  message: string;
};

export const TALENT_CRM_SCHEMA_REQUIREMENTS: readonly CrmSchemaRequirement[] = [
  { table: "talent_pools", label: "Talent pools", columns: ["id", "employer_user_id", "name", "description", "visibility", "is_archived", "created_by", "created_at", "updated_at"] },
  { table: "talent_pool_members", label: "Talent pool members", columns: ["id", "pool_id", "candidate_id", "application_id", "engagement_status", "source", "tags", "notes", "last_contacted_at", "next_follow_up_at", "added_by", "created_at", "updated_at"] },
  { table: "employer_contacts", label: "Employer contacts", columns: ["id", "employer_user_id", "full_name", "work_email", "phone", "job_title", "department", "contact_type", "status", "notes", "created_by", "created_at", "updated_at"] },
  { table: "employee_referrals", label: "Referrals", columns: ["id", "employer_user_id", "referrer_name", "candidate_name", "status", "reward_amount", "reward_status", "created_at", "updated_at"] },
  { table: "referral_history", label: "Referral history", columns: ["id", "referral_id", "previous_status", "new_status", "changed_by", "created_at"] },
  { table: "career_pages", label: "Career pages", columns: ["id", "employer_user_id", "slug", "company_name", "headline", "mission", "vision", "values", "culture", "benefits", "team_stories", "logo_url", "cover_url", "video_url", "seo_title", "seo_description", "is_published", "created_at", "updated_at"] },
  { table: "career_page_events", label: "Career analytics", columns: ["id", "career_page_id", "event_type", "job_id", "source", "session_hash", "created_at"] },
  { table: "offer_templates", label: "Offer templates", columns: ["id", "employer_user_id", "name", "title_template", "body_template", "variables", "approval_steps", "is_default", "is_archived", "current_version", "created_at", "updated_at"] },
  { table: "offer_template_versions", label: "Offer template versions", columns: ["id", "template_id", "version", "title_template", "body_template", "variables", "approval_steps", "created_at"] },
  { table: "talent_messages", label: "Talent messages", columns: ["id", "employer_user_id", "candidate_id", "application_id", "channel", "direction", "message_type", "subject", "body", "status", "created_at", "updated_at"] },
  { table: "communication_logs", label: "Communication logs", columns: ["id", "employer_user_id", "contact_id", "candidate_id", "message_id", "channel", "direction", "occurred_at"] },
  { table: "candidate_portal_documents", label: "Candidate documents", columns: ["id", "candidate_user_id", "application_id", "document_type", "file_name", "storage_bucket", "storage_path", "created_at"] }
] as const;

function cleanIdentifier(value: string) {
  return value.replace(/^public\./, "").replace(/["']/g, "").trim();
}
export function parseCrmSchemaDiagnostic(error: unknown): CrmSchemaDiagnostic | null {
  const source = error && typeof error === "object" ? error as Record<string, unknown> : null;
  const message = String(source?.message || (error instanceof Error ? error.message : error) || "");
  const details = String(source?.details || "");
  const combined = `${message} ${details}`.trim();

  const missingTable = combined.match(/(?:relation|table)\s+["']?(?:public\.)?([a-z_][a-z0-9_]*)["']?\s+(?:does not exist|could not be found)/i)
    || combined.match(/could not find the table\s+["']?(?:public\.)?([a-z_][a-z0-9_]*)/i);
  if (missingTable) {
    const table = cleanIdentifier(missingTable[1]);
    return { type: "table", object: table, table, message: `Missing table: ${table}` };
  }

  const missingColumn = combined.match(/column\s+["']?(?:public\.)?([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)["']?\s+does not exist/i)
    || combined.match(/could not find the\s+["']([a-z_][a-z0-9_]*)["']\s+column of\s+["']([a-z_][a-z0-9_]*)["']/i);
  if (missingColumn) {
    const reversed = /could not find the/i.test(missingColumn[0]);
    const table = cleanIdentifier(reversed ? missingColumn[2] : missingColumn[1]);
    const column = cleanIdentifier(reversed ? missingColumn[1] : missingColumn[2]);
    return { type: "column", object: `${table}.${column}`, table, message: `Missing column: ${table}.${column}` };
  }

  const relationship = combined.match(/relationship between\s+["']?([a-z_][a-z0-9_]*)["']?\s+and\s+["']?([a-z_][a-z0-9_]*)/i);
  if (relationship) {
    const object = `${relationship[1]} -> ${relationship[2]}`;
    return { type: "relationship", object, table: relationship[1], message: `Missing relationship: ${object}` };
  }

  const missingFunction = combined.match(/function\s+(?:public\.)?([a-z_][a-z0-9_]*)[^\n]*does not exist/i)
    || combined.match(/could not find the function\s+(?:public\.)?([a-z_][a-z0-9_]*)/i);
  if (missingFunction) {
    const fn = cleanIdentifier(missingFunction[1]);
    return { type: "function", object: fn, message: `Missing function: ${fn}` };
  }

  return /schema cache|does not exist|could not find/i.test(combined)
    ? { type: "unknown", object: "unknown", message: `Talent CRM schema mismatch: ${message || "unknown database object"}` }
    : null;
}
