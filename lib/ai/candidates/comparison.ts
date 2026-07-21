import { confidenceFromScore } from "@/lib/ai/candidates/confidenceEngine";
import type { CandidateComparison, CandidateMatch } from "@/lib/ai/candidates/types";

export function compareCandidateMatches(candidates: Array<{ candidateId: string; candidateName: string; match: CandidateMatch }>): CandidateComparison {
  const ranked = [...candidates].sort((a, b) => b.match.score - a.match.score);
  const confidence = confidenceFromScore(ranked.length ? ranked.reduce((sum, item) => sum + item.match.confidence.score, 0) / ranked.length : 0);
  const humanReviewRequired = ranked.some((item) => item.match.humanReviewRequired) || confidence.score < 70;
  const winner = !humanReviewRequired && ranked.length > 1 && ranked[0].match.score - ranked[1].match.score >= 4 ? ranked[0].candidateId : null;
  return { winner, candidates: ranked, evidence: ranked.flatMap((item) => item.match.evidence), confidence, unknowns: ranked.flatMap((item) => item.match.unknowns), reasoning: winner ? "Highest evidence-based job match with a meaningful score difference; recruiter review remains required." : "Evidence does not support a reliable single leading candidate. Review unknowns and interview evidence.", humanReviewRequired };
}
