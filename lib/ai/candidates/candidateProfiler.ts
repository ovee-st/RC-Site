import { calculateConfidence } from "@/lib/ai/candidates/confidenceEngine";
import { assessRisks } from "@/lib/ai/candidates/riskAssessment";
import { assessStrengths } from "@/lib/ai/candidates/strengthAssessment";
import { CANDIDATE_PROMPT_VERSION } from "@/lib/ai/candidates/prompts";
import { CANDIDATE_PROMPTS } from "@/lib/ai/candidates/prompts";
import type { CandidateInsight, CandidateProfileAnalysis, ParsedResume } from "@/lib/ai/candidates/types";
import { requestRecruitingJson } from "@/lib/ai/recruitingOpenAi";

function insight(title: string, statement: string, evidence: CandidateInsight["evidence"], unknowns: CandidateInsight["unknowns"] = []): CandidateInsight {
  return { title, statement: statement || "Unknown", evidence, confidence: calculateConfidence({ evidenceQuality: evidence.length ? 90 : 25, completeness: statement ? 75 : 10, consistency: 80 }), unknowns, reasoning: evidence.length ? "Derived from explicit resume evidence." : "No supported evidence was available; recruiter clarification is required." };
}

export function profileCandidate(resume: ParsedResume): CandidateProfileAnalysis {
  const skills = resume.skills.value;
  const roles = resume.employmentHistory.value;
  const strengths = assessStrengths(resume);
  const noEvidence = [{ field: "profile", reason: "Not found in resume" }];
  return {
    professionalSummary: insight("Professional summary", [resume.currentPosition.value, resume.currentCompany.value, skills.slice(0, 5).join(", ")].filter(Boolean).join(" | "), [...resume.currentPosition.evidence, ...resume.currentCompany.evidence, ...resume.skills.evidence], noEvidence),
    careerHighlights: resume.achievements.value.map((item) => insight("Career highlight", item, resume.achievements.evidence)),
    leadership: insight("Leadership", /lead|manage|supervis|mentor/i.test(resume.rawText) ? "Leadership or management responsibility is mentioned." : "Unknown", resume.employmentHistory.evidence, /lead|manage|supervis|mentor/i.test(resume.rawText) ? [] : [{ field: "leadership", reason: "Leadership responsibility not mentioned" }]),
    technicalStrengths: skills.slice(0, 8).map((skill) => insight(skill, `${skill} is explicitly mentioned.`, resume.skills.evidence)),
    softSkills: ["Communication", "Leadership", "Problem Solving", "Collaboration"].filter((skill) => new RegExp(skill.replace(" ", "\\s*"), "i").test(resume.rawText)).map((skill) => insight(skill, `${skill} is mentioned in resume context.`, resume.employmentHistory.evidence)),
    industryExperience: insight("Industry experience", "Industry must be validated from the listed employers and responsibilities.", resume.employmentHistory.evidence, roles.length ? [] : [{ field: "industryExperience", reason: "No employment evidence available" }]),
    managementExperience: insight("Management experience", /manage|supervis|team of/i.test(resume.rawText) ? "Management activity is explicitly mentioned." : "Unknown", resume.employmentHistory.evidence, /manage|supervis|team of/i.test(resume.rawText) ? [] : [{ field: "managementExperience", reason: "Management scope not mentioned" }]),
    careerProgression: insight("Career progression", roles.length > 1 ? "Multiple employment entries are available for recruiter review." : "Unknown", resume.employmentHistory.evidence, roles.length > 1 ? [] : [{ field: "careerProgression", reason: "Insufficient dated roles" }]),
    strengths,
    risks: assessRisks(resume),
    unknowns: [resume.location, resume.education, resume.certifications, resume.languages].flatMap((field) => field.unknowns),
    parsedResume: resume,
    promptVersion: CANDIDATE_PROMPT_VERSION,
    model: process.env.OPENAI_CANDIDATE_MODEL || "deterministic-evidence-v1"
  };
}

type AiProfileNarrative = { professionalSummary?: { statement?: string; evidenceIds?: string[]; reasoning?: string } };
const PROTECTED_LANGUAGE = /\b(age|gender|race|religion|nationality|disability|political|sexual orientation|marital|pregnan)\b/i;

export async function profileCandidateWithAi(resume: ParsedResume): Promise<CandidateProfileAnalysis> {
  const fallback = profileCandidate(resume);
  const evidence = [resume.currentPosition, resume.currentCompany, resume.employmentHistory, resume.education, resume.skills, resume.achievements, resume.certifications, resume.languages].flatMap((field) => field.evidence);
  const ai = await requestRecruitingJson<AiProfileNarrative>(CANDIDATE_PROMPTS.profile, {
    deterministicProfile: { professionalSummary: fallback.professionalSummary, strengths: fallback.strengths, unknowns: fallback.unknowns },
    evidenceCatalog: evidence.map((item) => ({ id: item.id, field: item.field, quote: item.quote, source: item.source, page: item.page })),
    expectedShape: { professionalSummary: { statement: "string", evidenceIds: ["evidence-id"], reasoning: "string" } }
  });
  const candidate = ai?.professionalSummary;
  const evidenceIds = Array.isArray(candidate?.evidenceIds) ? candidate.evidenceIds : [];
  const selected = evidence.filter((item) => evidenceIds.includes(item.id));
  if (!candidate?.statement || !selected.length || PROTECTED_LANGUAGE.test(candidate.statement)) return fallback;
  return { ...fallback, professionalSummary: { ...fallback.professionalSummary, statement: candidate.statement, evidence: selected, unknowns: [], reasoning: candidate.reasoning || "AI-assisted narrative validated against explicit evidence references." }, model: process.env.OPENAI_CANDIDATE_MODEL || process.env.OPENAI_RECRUITING_MODEL || "gpt-4o-mini" };
}
