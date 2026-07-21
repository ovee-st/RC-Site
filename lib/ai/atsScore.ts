import type { RecruitingJobInput, ScoreResult } from "@/lib/ai/recruitingTypes";
import { scoreBand } from "@/lib/ai/qualityScore";

function words(value: string) {
  return value.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || [];
}
export function calculateAtsScore(job: RecruitingJobInput): ScoreResult & { missingKeywords: string[] } {
  const content = `${job.title} ${job.summary} ${job.responsibilities} ${job.requirements}`.toLowerCase();
  const uniqueSkills = Array.from(new Set(job.skills.map((skill) => skill.trim()).filter(Boolean)));
  const missingKeywords = uniqueSkills.filter((skill) => !content.includes(skill.toLowerCase()));
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (uniqueSkills.length >= 5) score += 22;
  else { score += uniqueSkills.length * 4; missing.push("Skill coverage"); recommendations.push("Add at least five role-specific skills."); }

  const keywordCoverage = uniqueSkills.length ? (uniqueSkills.length - missingKeywords.length) / uniqueSkills.length : 0;
  score += Math.round(keywordCoverage * 18);
  if (missingKeywords.length) recommendations.push(`Use important skills naturally in the job copy: ${missingKeywords.slice(0, 5).join(", ")}.`);

  if (job.requirements.length >= 80) score += 16; else { missing.push("Clear requirements"); recommendations.push("Clarify the minimum candidate requirements."); }
  if (job.responsibilities.length >= 120) score += 16; else { missing.push("Responsibilities"); recommendations.push("Add specific, outcome-focused responsibilities."); }
  if (job.experience) score += 10; else missing.push("Experience");
  if (job.education) score += 7; else missing.push("Education");
  if (job.title.length >= 4 && job.title.length <= 70) score += 7; else recommendations.push("Use a concise, searchable job title.");
  if (job.summary.length >= 60) score += 4; else { missing.push("Summary"); recommendations.push("Add a concise job summary."); }

  const densityBase = words(`${job.summary} ${job.responsibilities} ${job.requirements}`).length;
  if (densityBase > 0 && keywordCoverage >= 0.4) score += 0;
  score = Math.min(100, score);
  return { score, band: scoreBand(score), missing: Array.from(new Set(missing)), recommendations, missingKeywords };
}
