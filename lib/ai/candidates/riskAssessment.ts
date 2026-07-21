import { calculateConfidence } from "@/lib/ai/candidates/confidenceEngine";
import type { ParsedResume, RiskObservation } from "@/lib/ai/candidates/types";

export function assessRisks(resume: ParsedResume): RiskObservation[] {
  const observations: RiskObservation[] = [];
  if (!resume.employmentHistory.value.length) observations.push({ title: "Employment history needs clarification", statement: "No structured employment history was detected.", evidence: [], confidence: calculateConfidence({ evidenceQuality: 20, completeness: 20, consistency: 50 }), unknowns: [{ field: "employmentHistory", reason: "Employment history not found or not parseable" }], reasoning: "Absence in parsed text is not proof that the candidate lacks experience.", alternativeExplanation: "The resume may use an unsupported layout or the candidate may provide experience separately." });
  if (!resume.certifications.value.length) observations.push({ title: "Certification status unknown", statement: "No certification was detected in the resume.", evidence: [], confidence: calculateConfidence({ evidenceQuality: 20, completeness: 30, consistency: 70 }), unknowns: [{ field: "certifications", reason: "Certification not mentioned" }], reasoning: "The system records missing evidence without assuming the candidate has no certification.", alternativeExplanation: "The candidate may hold relevant certification that is omitted from this resume." });
  const datedRoles = resume.rawText.match(/(?:19|20)\d{2}\s*[-–]\s*(?:(?:19|20)\d{2}|present)/gi) || [];
  if (datedRoles.length >= 4) observations.push({ title: "Role tenure merits review", statement: "Several dated employment periods appear in the resume.", evidence: resume.employmentHistory.evidence, confidence: calculateConfidence({ evidenceQuality: 75, completeness: 65, consistency: 70 }), unknowns: [{ field: "employmentTransitions", reason: "Reasons for transitions are not provided" }], reasoning: "Multiple roles are an interview topic, not a negative hiring conclusion.", alternativeExplanation: "Transitions may reflect contracts, promotions, restructuring, or intentional career growth." });
  return observations;
}
