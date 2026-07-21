import { cosineSimilarity, localEmbedding } from "@/lib/ai/matching";

export type RelatedJobCandidate = {
  id: string;
  company_name: string | null;
  job_title: string;
  job_location: string | null;
  employment_type: string | null;
  job_type: string | null;
  category: string;
  experience_level: string | null;
  job_level: string | null;
  required_skills: string | null;
  required_skills_array: string[] | null;
  description: string | null;
  requirements: string | null;
};

export interface RelatedJobRanker<T extends RelatedJobCandidate = RelatedJobCandidate> {
  rank(source: T, candidates: T[]): T[];
}

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function skills(job: RelatedJobCandidate) {
  const values = Array.isArray(job.required_skills_array)
    ? job.required_skills_array
    : String(job.required_skills || "").split(",");
  return new Set(values.map((value) => normalize(value)).filter(Boolean));
}

function jobText(job: RelatedJobCandidate) {
  return [job.job_title, job.category, job.job_location, job.experience_level, job.employment_type, job.required_skills, job.description, job.requirements]
    .filter(Boolean)
    .join(" ");
}

export function relatedJobScore(source: RelatedJobCandidate, candidate: RelatedJobCandidate) {
  let score = 0;
  if (normalize(source.category) === normalize(candidate.category)) score += 35;
  if (normalize(source.job_location) === normalize(candidate.job_location)) score += 12;
  if (normalize(source.experience_level || source.job_level) === normalize(candidate.experience_level || candidate.job_level)) score += 10;
  if (normalize(source.employment_type || source.job_type) === normalize(candidate.employment_type || candidate.job_type)) score += 8;
  if (normalize(source.company_name) === normalize(candidate.company_name)) score += 5;

  const sourceSkills = skills(source);
  const candidateSkills = skills(candidate);
  const overlap = Array.from(sourceSkills).filter((skill) => candidateSkills.has(skill)).length;
  if (sourceSkills.size) score += (overlap / sourceSkills.size) * 30;

  const semantic = Math.max(0, cosineSimilarity(localEmbedding(jobText(source)), localEmbedding(jobText(candidate))));
  score += semantic * 15;
  return score;
}

export const defaultRelatedJobRanker: RelatedJobRanker = {
  rank(source, candidates) {
    return candidates
      .map((candidate) => ({ candidate, score: relatedJobScore(source, candidate) }))
      .sort((a, b) => b.score - a.score)
      .map(({ candidate }) => candidate);
  }
};
