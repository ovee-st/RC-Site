import type { EvidenceReference } from "@/lib/ai/candidates/types";

const PROTECTED = /\b(age|gender|race|religion|nationality|disability|political|sexual|marital|pregnan|male|female)\b/i;
export type CopilotCandidate = { id: string; name: string; title: string; skills: string[]; profile: string; location?: string; languages?: string[] };
export type CopilotResult = { candidateId: string; candidateName: string; why: string; evidence: EvidenceReference[]; confidence: number };

export function searchCandidates(query: string, candidates: CopilotCandidate[]): CopilotResult[] {
  if (PROTECTED.test(query)) throw new Error("Search cannot use protected characteristics.");
  const tokens = (query.toLowerCase().match(/[a-z0-9+#.]{2,}/g) || []).filter((token) => !new Set(["show", "find", "with", "candidates", "applicants"]).has(token));
  return candidates.map((candidate) => {
    const searchable = [candidate.title, candidate.location, candidate.profile, ...candidate.skills, ...(candidate.languages || [])].join(" ").toLowerCase();
    const matches = tokens.filter((token) => searchable.includes(token));
    const quote = [candidate.title, ...candidate.skills].filter((value) => matches.some((token) => value.toLowerCase().includes(token))).join(", ");
    return { candidateId: candidate.id, candidateName: candidate.name, why: matches.length ? `Matched job-related terms: ${matches.join(", ")}.` : "No explicit matching evidence.", evidence: matches.length ? [{ id: `copilot-${candidate.id}`, field: "copilotSearch", quote, source: "Candidate profile", confidence: 85 }] : [], confidence: tokens.length ? Math.round(matches.length / tokens.length * 100) : 0 };
  }).filter((item) => item.evidence.length).sort((a, b) => b.confidence - a.confidence);
}
