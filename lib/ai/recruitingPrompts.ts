import type { ImproveAction } from "@/lib/ai/recruitingTypes";

export const RECRUITING_PROMPTS = {
  review: "Review the job for recruiter quality and return structured recommendations plus recruiterSummary. Keep recommendations factual and actionable.",
  improve: (action: ImproveAction) => `Improve only the ${action} section. Do not change or return unrelated fields. Rewrite only from supplied facts. Return {\"updates\": {...}}.`,
  interview: "Generate a job-specific interview pack using the exact supplied schema. Questions may assess capability but must not assume unstated job facts.",
  screening: "Generate structured screening questions using only supplied job requirements. Include yes/no, multiple-choice, and short-answer questions. Do not ask about protected characteristics."
};
