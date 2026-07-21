import { NextResponse } from "next/server";
import { improveJob } from "@/lib/ai/jobImprover";
import { cachedRecruitingResult, parseRecruitingJobInput, readRecruitingRequest } from "@/lib/ai/recruitingApi";
import type { ImproveAction } from "@/lib/ai/recruitingTypes";

const ACTIONS = new Set<ImproveAction>(["title", "description", "requirements", "responsibilities", "benefits", "skills", "seo", "readability", "ats"]);

export async function POST(request: Request) {
  const context = await readRecruitingRequest(request);
  if ("response" in context) return context.response;
  const job = parseRecruitingJobInput(context.body.job);
  const action = String(context.body.action || "") as ImproveAction;
  if (!job || !ACTIONS.has(action)) return NextResponse.json({ error: "A valid job and improvement action are required." }, { status: 400 });
  const output = await cachedRecruitingResult(`improve:${action}`, context.userId, job, () => improveJob(job, action));
  return NextResponse.json(output);
}
