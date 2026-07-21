import { NextResponse } from "next/server";
import { cachedCandidateAi, candidateAiErrorResponse, loadCandidate, loadJob, loadParsedResume, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { generateCandidateInterview } from "@/lib/ai/candidates/interviewAssistant";

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const candidateId = String(context.body.candidate_id || ""), jobId = String(context.body.job_id || ""); if (!candidateId || !jobId) return NextResponse.json({ error: "candidate_id and job_id are required." }, { status: 400 });
  try {
  const output = await cachedCandidateAi("interview", { candidateId, jobId }, async () => { const candidate = await loadCandidate(context.client, candidateId), job = await loadJob(context.client, jobId); if (!candidate || !job) throw new Error("Candidate or job was not found."); return generateCandidateInterview(await loadParsedResume(context.client, candidate), job); });
  return NextResponse.json(output);
  } catch (error) { return candidateAiErrorResponse(error); }
}
