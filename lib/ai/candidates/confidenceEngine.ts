import type { Confidence } from "@/lib/ai/candidates/types";

export const DEFAULT_HUMAN_REVIEW_THRESHOLD = Number(process.env.AI_HUMAN_REVIEW_THRESHOLD || 70);

export function confidenceFromScore(score: number): Confidence {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return { score: normalized, level: normalized >= 80 ? "High" : normalized >= 55 ? "Medium" : "Low" };
}

export function calculateConfidence(input: { evidenceQuality: number; completeness: number; consistency: number; aiCertainty?: number }) {
  return confidenceFromScore((input.evidenceQuality * 0.4) + (input.completeness * 0.3) + (input.consistency * 0.2) + ((input.aiCertainty ?? 70) * 0.1));
}

export function requiresHumanReview(confidence: Confidence, threshold = DEFAULT_HUMAN_REVIEW_THRESHOLD) { return confidence.score < threshold; }
