import { NextResponse } from "next/server";
import { cachedCandidateAi, bestEffortInsert, candidateAiErrorResponse, loadCandidate, loadParsedResume, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { profileCandidateWithAi } from "@/lib/ai/candidates/candidateProfiler";
import { timelineEvent } from "@/lib/ai/candidates/timeline";

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const candidateId = String(context.body.candidate_id || ""); if (!candidateId) return NextResponse.json({ error: "candidate_id is required." }, { status: 400 });
  try {
  const output = await cachedCandidateAi("analyze", candidateId, async () => {
    const candidate = await loadCandidate(context.client, candidateId); if (!candidate) throw new Error("Candidate was not found.");
    return profileCandidateWithAi(await loadParsedResume(context.client, candidate));
  });
  await bestEffortInsert(context.client, "candidate_ai_analyses", { candidate_id: candidateId, created_by: context.userId, analysis_type: "profile", prompt_version: output.result.promptVersion, model: output.result.model, output: output.result });
  if (!output.cached) {
    const parsed = timelineEvent("Resume Parsed", "system", { source: output.result.parsedResume.fileName });
    await bestEffortInsert(context.client, "candidate_ai_timeline", { id: parsed.id, candidate_id: candidateId, created_by: context.userId, event: parsed.event, timestamp: parsed.timestamp, actor_type: parsed.actorType, metadata: parsed.metadata });
  }
  const event = timelineEvent(output.cached ? "AI Version" : "AI Analysis", "ai", { cached: output.cached });
  await bestEffortInsert(context.client, "candidate_ai_timeline", { id: event.id, candidate_id: candidateId, created_by: context.userId, event: event.event, timestamp: event.timestamp, actor_type: event.actorType, metadata: event.metadata });
  return NextResponse.json(output);
  } catch (error) { return candidateAiErrorResponse(error); }
}
