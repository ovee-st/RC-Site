import { requestRecruitingJson } from "@/lib/ai/recruitingOpenAi";
import { RECRUITING_PROMPTS } from "@/lib/ai/recruitingPrompts";
import type { RecruitingJobInput, ScreeningPack, ScreeningQuestion } from "@/lib/ai/recruitingTypes";

export function deterministicScreeningPack(job: RecruitingJobInput): ScreeningPack {
  const required: ScreeningQuestion[] = [
    { id: "experience", type: "yes_no", question: `Do you meet the required experience: ${job.experience || "the experience described in the job"}?`, required: true, idealAnswer: "Yes" },
    { id: "location", type: "yes_no", question: `Can you work from or serve ${job.location || "the listed location"}?`, required: true, idealAnswer: "Yes" },
    { id: "arrangement", type: "multiple_choice", question: "Which work arrangement can you support?", required: true, options: Array.from(new Set([job.workArrangement || "As listed", "Remote", "Hybrid", "On-site"])), idealAnswer: job.workArrangement || "As listed" }
  ];
  job.skills.slice(0, 5).forEach((skill, index) => required.push({ id: `skill-${index + 1}`, type: "yes_no", question: `Do you have practical experience with ${skill}?`, required: true, idealAnswer: "Yes" }));
  const optional: ScreeningQuestion[] = [
    { id: "example", type: "short_answer", question: "Describe one relevant result that demonstrates your fit for this role.", required: false },
    { id: "availability", type: "short_answer", question: "What is your earliest available start date?", required: false },
    { id: "motivation", type: "short_answer", question: `Why are you interested in this ${job.title || "role"}?`, required: false }
  ];
  return { requiredQuestions: required.slice(0, 10), optionalQuestions: optional, aiEnhanced: false };
}

export async function generateScreeningPack(job: RecruitingJobInput): Promise<ScreeningPack> {
  const fallback = deterministicScreeningPack(job);
  const ai = await requestRecruitingJson<Partial<ScreeningPack>>(
    RECRUITING_PROMPTS.screening,
    { job, expectedShape: fallback }
  );
  if (!ai || !Array.isArray(ai.requiredQuestions)) return fallback;
  return {
    requiredQuestions: ai.requiredQuestions.slice(0, 12) as ScreeningQuestion[],
    optionalQuestions: Array.isArray(ai.optionalQuestions) ? ai.optionalQuestions.slice(0, 10) as ScreeningQuestion[] : fallback.optionalQuestions,
    aiEnhanced: true
  };
}
