import type { SupabaseClient } from "@supabase/supabase-js";
import { CANDIDATE_PROMPT_VERSION } from "@/lib/ai/candidates/prompts";
import type { EvidenceReference, Unknown } from "@/lib/ai/candidates/types";

export type DecisionAuditEntry = { candidateId: string; jobId?: string; action: string; actorId: string; model: string; confidence: number; evidence: EvidenceReference[]; unknowns: Unknown[]; humanAction?: string };
export async function writeDecisionAudit(client: SupabaseClient, entry: DecisionAuditEntry) {
  const { error } = await client.from("candidate_ai_decision_audit").insert({ candidate_id: entry.candidateId, job_id: entry.jobId || null, actor_id: entry.actorId, action: entry.action, prompt_version: CANDIDATE_PROMPT_VERSION, model: entry.model, confidence: entry.confidence, evidence_references: entry.evidence, unknowns: entry.unknowns, human_action: entry.humanAction || null });
  if (error && !/does not exist|schema cache/i.test(error.message)) console.error("[candidate-ai-audit] write failed", { code: error.code, message: error.message });
}
