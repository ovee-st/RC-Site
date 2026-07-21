import { calculateConfidence, confidenceFromScore, requiresHumanReview } from "@/lib/ai/candidates/confidenceEngine";
import { analyzeSkillGap } from "@/lib/ai/candidates/skillGap";
import type { CandidateJob, CandidateMatch, EvidenceReference, MatchDimension, ParsedResume } from "@/lib/ai/candidates/types";

const WEIGHTS: Record<string, number> = { Skills: 25, Experience: 18, Education: 10, Industry: 10, Location: 8, Salary: 8, Language: 6, Certifications: 6, "Employment Type": 9 };
function terms(value: string) { return value.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || []; }
function overlap(required: string[], supplied: string[]) { const actual = new Set(supplied.map((item) => item.toLowerCase())); return required.length ? required.filter((item) => actual.has(item.toLowerCase())).length / required.length : null; }
function dimension(name: string, ratio: number | null, evidence: EvidenceReference[], unknownReason: string): MatchDimension {
  const unknowns = ratio === null ? [{ field: name, reason: unknownReason }] : [];
  const score = ratio === null ? 50 : Math.round(ratio * 100);
  return { name, score, evidence, confidence: calculateConfidence({ evidenceQuality: evidence.length ? 90 : 25, completeness: ratio === null ? 10 : 85, consistency: 80 }), unknowns, reasoning: ratio === null ? "No scoreable evidence was available; this dimension remains unknown." : "Score is based on explicit overlap between job requirements and candidate evidence." };
}

export function matchCandidateEvidence(resume: ParsedResume, job: CandidateJob, threshold?: number): CandidateMatch {
  const skillGap = analyzeSkillGap(job.skills, resume);
  const resumeText = resume.rawText.toLowerCase();
  const experienceTerms = terms(job.experience);
  const educationTerms = terms(job.education);
  const dimensions = [
    dimension("Skills", overlap(job.skills, resume.skills.value), resume.skills.evidence, "Candidate skills not found in resume"),
    dimension("Experience", experienceTerms.length ? experienceTerms.filter((term) => resumeText.includes(term)).length / experienceTerms.length : null, resume.employmentHistory.evidence, "Job experience requirement not specified"),
    dimension("Education", educationTerms.length ? educationTerms.filter((term) => resumeText.includes(term)).length / educationTerms.length : null, resume.education.evidence, "Education requirement or candidate education not specified"),
    dimension("Industry", job.industry ? (resumeText.includes(job.industry.toLowerCase()) ? 1 : 0) : null, resume.employmentHistory.evidence, "Industry requirement not specified"),
    dimension("Location", job.location && resume.location.value ? (resume.location.value.toLowerCase().includes(job.location.toLowerCase()) || job.location.toLowerCase().includes(resume.location.value.toLowerCase()) ? 1 : 0) : null, resume.location.evidence, "Candidate or job location not available"),
    dimension("Salary", null, [], "Candidate salary expectation is not provided"),
    dimension("Language", overlap(job.languages, resume.languages.value), resume.languages.evidence, "Language requirement not specified"),
    dimension("Certifications", overlap(job.certifications, resume.certifications.value), resume.certifications.evidence, "Certification requirement not specified"),
    dimension("Employment Type", job.employmentType ? (resumeText.includes(job.employmentType.toLowerCase()) ? 1 : null) : null, resume.employmentHistory.evidence, "Candidate employment-type preference is not provided")
  ];
  const score = Math.round(dimensions.reduce((sum, item) => sum + item.score * WEIGHTS[item.name], 0) / 100);
  const confidence = confidenceFromScore(dimensions.reduce((sum, item) => sum + item.confidence.score, 0) / dimensions.length);
  const humanReviewRequired = requiresHumanReview(confidence, threshold);
  const recommendation = humanReviewRequired ? "Need More Information" : score >= 85 ? "Strong Hire" : score >= 68 ? "Interview" : "Keep in Pipeline";
  const unknowns = dimensions.flatMap((item) => item.unknowns);
  return { score, dimensions, skillGap, recommendation, evidence: dimensions.flatMap((item) => item.evidence), confidence, unknowns, reasoning: humanReviewRequired ? "Confidence is below the human-review threshold, so no substantive hiring recommendation is made." : "Recommendation summarizes job-related evidence only and requires recruiter review.", humanReviewRequired, suggestedQuestions: unknowns.slice(0, 8).map((item) => `Please clarify ${item.field.toLowerCase()}: ${item.reason}.`), suggestedDocuments: unknowns.filter((item) => /education|certification|employment/i.test(item.field)).map((item) => `Evidence for ${item.field}`) };
}
