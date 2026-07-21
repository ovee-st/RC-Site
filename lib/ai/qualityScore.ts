import type { RecruitingJobInput, ScoreBand, ScoreResult } from "@/lib/ai/recruitingTypes";

const QUALITY_FIELDS: Array<{ key: keyof RecruitingJobInput; label: string; weight: number; valid: (value: RecruitingJobInput[keyof RecruitingJobInput]) => boolean }> = [
  { key: "title", label: "Title", weight: 8, valid: (value) => String(value).trim().length >= 4 },
  { key: "company", label: "Company", weight: 4, valid: hasText },
  { key: "location", label: "Location", weight: 7, valid: hasText },
  { key: "salary", label: "Salary", weight: 7, valid: hasText },
  { key: "employmentType", label: "Employment type", weight: 5, valid: hasText },
  { key: "experience", label: "Experience", weight: 6, valid: hasText },
  { key: "education", label: "Education", weight: 4, valid: hasText },
  { key: "responsibilities", label: "Responsibilities", weight: 9, valid: (value) => String(value).trim().length >= 80 },
  { key: "requirements", label: "Requirements", weight: 9, valid: (value) => String(value).trim().length >= 60 },
  { key: "skills", label: "Skills", weight: 9, valid: (value) => Array.isArray(value) && value.length >= 3 },
  { key: "benefits", label: "Benefits", weight: 5, valid: hasText },
  { key: "deadline", label: "Application deadline", weight: 7, valid: hasText },
  { key: "metaDescription", label: "SEO metadata", weight: 7, valid: (value) => String(value).trim().length >= 70 },
  { key: "category", label: "Category", weight: 5, valid: hasText },
  { key: "industry", label: "Industry", weight: 4, valid: hasText },
  { key: "workArrangement", label: "Work arrangement", weight: 4, valid: hasText }
];

function hasText(value: unknown) {
  return String(value || "").trim().length > 0;
}
export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Improvement";
}

export function calculateQualityScore(job: RecruitingJobInput): ScoreResult {
  let score = 0;
  const missing: string[] = [];
  for (const field of QUALITY_FIELDS) {
    if (field.valid(job[field.key])) score += field.weight;
    else missing.push(field.label);
  }

  const recommendations = missing.map((field) => `Add or strengthen ${field.toLowerCase()}.`);
  return { score, band: scoreBand(score), missing, recommendations };
}

export function qualityStars(score: number) {
  return Math.max(0, Math.min(5, Math.round(score / 20)));
}
