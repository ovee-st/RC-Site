import { calculateConfidence } from "@/lib/ai/candidates/confidenceEngine";
import type { CandidateInsight, ParsedResume } from "@/lib/ai/candidates/types";

export function assessStrengths(resume: ParsedResume): CandidateInsight[] {
  const results: CandidateInsight[] = [];
  const add = (title: string, statement: string, evidence = resume.skills.evidence) => results.push({ title, statement, evidence, confidence: calculateConfidence({ evidenceQuality: evidence.length ? 90 : 40, completeness: 80, consistency: 85 }), unknowns: evidence.length ? [] : [{ field: title, reason: "Supporting evidence not found in resume" }], reasoning: "Identified from explicit resume content; recruiter validation is required." });
  if (resume.skills.value.length) add("Technical expertise", `Resume mentions ${resume.skills.value.slice(0, 8).join(", ")}.`);
  if (resume.achievements.value.length) add("Achievements", resume.achievements.value[0], resume.achievements.evidence);
  if (/lead|manage|supervis|mentor/i.test(resume.rawText)) add("Leadership", "Resume contains explicit leadership or management language.", resume.employmentHistory.evidence);
  if (/communicat|present|stakeholder|client/i.test(resume.rawText)) add("Communication", "Resume references communication with clients, teams, or stakeholders.", resume.employmentHistory.evidence);
  if (/solve|improv|optimi|automat|reduc|increase/i.test(resume.rawText)) add("Problem solving", "Resume describes problem solving, improvement, or measurable change.", resume.achievements.evidence.length ? resume.achievements.evidence : resume.employmentHistory.evidence);
  return results;
}
