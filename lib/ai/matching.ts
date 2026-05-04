import type { Candidate, Job, MatchResult } from "@/types";

const EMBEDDING_SIZE = 24;

export function cosineSimilarity(a: number[] = [], b: number[] = []) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export function localEmbedding(text: string, size = EMBEDDING_SIZE) {
  const vector = Array(size).fill(0);
  text.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean).forEach((token) => {
    let hash = 0;
    for (let index = 0; index < token.length; index += 1) {
      hash = ((hash << 5) - hash) + token.charCodeAt(index);
      hash |= 0;
    }
    vector[Math.abs(hash) % size] += 1;
  });
  return vector;
}

export async function createEmbedding(text: string) {
  if (!process.env.OPENAI_API_KEY) return localEmbedding(text);
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0]?.embedding || localEmbedding(text);
}

export function buildJobText(job: Job) {
  return [job.title, job.category, job.experience, job.jobType, job.skills.join(", "), job.description, job.requirements].join(" ");
}

export function buildCandidateText(candidate: Candidate) {
  return [candidate.name, candidate.title, candidate.category, candidate.experience, candidate.skills.join(", "), candidate.profile].join(" ");
}

export function matchCandidateToJob(candidate: Candidate, job: Job): MatchResult {
  const candidateEmbedding = candidate.embedding?.length ? candidate.embedding : localEmbedding(buildCandidateText(candidate));
  const jobEmbedding = job.embedding?.length ? job.embedding : localEmbedding(buildJobText(job));
  const semanticScoreRaw = Math.max(0, cosineSimilarity(candidateEmbedding, jobEmbedding));
  const requiredSkills = job.skills.map((skill) => skill.toLowerCase());
  const candidateSkills = candidate.skills.map((skill) => skill.toLowerCase());
  const matchedSkills = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkills.includes(skill));
  const skillScore = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 0;
  const industryScore = candidate.category === job.category ? 1 : 0;
  const experienceScore = candidate.experience === job.experience ? 1 : 0;
  const finalScore = Math.round(((skillScore * 0.4) + (experienceScore * 0.3) + (semanticScoreRaw * 0.2) + (industryScore * 0.1)) * 100);

  return {
    score: Math.min(100, finalScore),
    matchedSkills: matchedSkills.map((skill) => skill.replace(/\b\w/g, (char) => char.toUpperCase())),
    missingSkills: missingSkills.map((skill) => skill.replace(/\b\w/g, (char) => char.toUpperCase())),
    semanticScore: Math.round(semanticScoreRaw * 100),
    breakdown: {
      skills: Math.round(skillScore * 40),
      experience: experienceScore * 30,
      semantic: Math.round(semanticScoreRaw * 20),
      industry: industryScore * 10
    }
  };
}



