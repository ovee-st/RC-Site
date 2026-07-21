import { NextResponse } from "next/server";
import { reviewJob } from "@/lib/ai/jobReviewer";
import { cachedRecruitingResult, parseRecruitingJobInput, readRecruitingRequest } from "@/lib/ai/recruitingApi";

export async function POST(request: Request) {
  const context = await readRecruitingRequest(request);
  if ("response" in context) return context.response;
  const job = parseRecruitingJobInput(context.body.job);
  if (!job) return NextResponse.json({ error: "A valid job with a title is required." }, { status: 400 });
  const output = await cachedRecruitingResult("review", context.userId, job, () => reviewJob(job));
  return NextResponse.json(output);
}
