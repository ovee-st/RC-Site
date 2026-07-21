import { NextResponse } from "next/server";
import { bestEffortInsert, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { writeDecisionAudit } from "@/lib/ai/candidates/decisionAudit";
import { timelineEvent } from "@/lib/ai/candidates/timeline";

const HUMAN_ACTIONS = new Set(["reviewed", "shortlisted", "invited", "interviewed", "offered", "decision_recorded"]);

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const candidateId = String(context.body.candidate_id || ""), jobId = String(context.body.job_id || ""), humanAction = String(context.body.human_action || "");
  if (!candidateId || !HUMAN_ACTIONS.has(humanAction)) return NextResponse.json({ error: "A valid candidate_id and human_action are required." }, { status: 400 });
  await writeDecisionAudit(context.client, { candidateId, jobId: jobId || undefined, actorId: context.userId, action: "human_action", model: "human", confidence: 100, evidence: [], unknowns: [], humanAction });
  const event = timelineEvent(humanAction === "interviewed" ? "Interview" : humanAction === "offered" ? "Offer" : humanAction === "decision_recorded" ? "Decision" : "Recruiter Review", "human", { humanAction, jobId: jobId || null });
  await bestEffortInsert(context.client, "candidate_ai_timeline", { id: event.id, candidate_id: candidateId, created_by: context.userId, event: event.event, timestamp: event.timestamp, actor_type: event.actorType, metadata: event.metadata });
  return NextResponse.json({ ok: true });
}
