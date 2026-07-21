import { NextResponse } from "next/server";
import { cachedCandidateAi, candidateAiErrorResponse, loadCandidate, loadJob, loadParsedResume, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { matchCandidateEvidence } from "@/lib/ai/candidates/matchEngine";
import { writeDecisionAudit } from "@/lib/ai/candidates/decisionAudit";

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const candidateId = String(context.body.candidate_id || ""), jobId = String(context.body.job_id || "");
  if (!candidateId || !jobId) return NextResponse.json({ error: "candidate_id and job_id are required." }, { status: 400 });
  try {
  const output = await cachedCandidateAi("match", { candidateId, jobId }, async () => { const candidate = await loadCandidate(context.client, candidateId), job = await loadJob(context.client, jobId); if (!candidate || !job) throw new Error("Candidate or job was not found."); return matchCandidateEvidence(await loadParsedResume(context.client, candidate), job); });
  await writeDecisionAudit(context.client, { candidateId, jobId, actorId: context.userId, action: "candidate_match", model: "deterministic-evidence-v1", confidence: output.result.confidence.score, evidence: output.result.evidence, unknowns: output.result.unknowns });
  return NextResponse.json(output);
  } catch (error) { return candidateAiErrorResponse(error); }
}
