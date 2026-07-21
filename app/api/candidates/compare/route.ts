import { NextResponse } from "next/server";
import { cachedCandidateAi, candidateAiErrorResponse, loadCandidate, loadJob, loadParsedResume, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { compareCandidateMatches } from "@/lib/ai/candidates/comparison";
import { matchCandidateEvidence } from "@/lib/ai/candidates/matchEngine";

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const candidateIds = Array.isArray(context.body.candidate_ids) ? context.body.candidate_ids.map(String).slice(0, 5) : [], jobId = String(context.body.job_id || "");
  if (candidateIds.length < 2 || !jobId) return NextResponse.json({ error: "Two or more candidate_ids and job_id are required." }, { status: 400 });
  try {
  const output = await cachedCandidateAi("compare", { candidateIds, jobId }, async () => { const job = await loadJob(context.client, jobId); if (!job) throw new Error("Job was not found."); const rows = await Promise.all(candidateIds.map(async (id) => { const candidate = await loadCandidate(context.client, id); if (!candidate) throw new Error("Candidate was not found."); return { candidateId: id, candidateName: String(candidate.full_name || candidate.name || "Candidate"), match: matchCandidateEvidence(await loadParsedResume(context.client, candidate), job) }; })); return compareCandidateMatches(rows); });
  return NextResponse.json(output);
  } catch (error) { return candidateAiErrorResponse(error); }
}
