import type { ParsedResume, SkillGapResult } from "@/lib/ai/candidates/types";

const TRANSFERABLE: Record<string, string[]> = { "Power BI": ["Tableau", "Excel"], "PostgreSQL": ["SQL", "MySQL"], "TypeScript": ["JavaScript"], "Recruitment": ["HR", "Talent Acquisition"], "Payroll": ["HR", "Excel"] };
export function analyzeSkillGap(requiredSkills: string[], resume: ParsedResume): SkillGapResult {
  const candidateSkills = resume.skills.value;
  const normalized = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const notMentioned = requiredSkills.filter((skill) => !normalized.has(skill.toLowerCase()));
  const transferableSkills = notMentioned.flatMap((skill) => (TRANSFERABLE[skill] || []).filter((alternative) => normalized.has(alternative.toLowerCase())));
  return { requiredSkills, candidateSkills, transferableSkills: Array.from(new Set(transferableSkills)), notMentioned, learningRecommendations: notMentioned.map((skill) => `Validate ${skill} in interview or recommend role-relevant learning if the candidate confirms a gap.`) };
}
