import type { DuplicateJobMatch, ExistingJobForDuplicateCheck, ExtractedJobFields } from "@/lib/import/types";

export const DEFAULT_DUPLICATE_THRESHOLD = 0.82;

function normalize(value: string | null | undefined) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 1));
}

export function textSimilarity(left: string, right: string) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function exactSimilarity(left: string | null, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  return a === b ? 1 : textSimilarity(a, b);
}

export function findDuplicateJobs(
  imported: ExtractedJobFields,
  existingJobs: ExistingJobForDuplicateCheck[],
  threshold = DEFAULT_DUPLICATE_THRESHOLD
): DuplicateJobMatch[] {
  const importedContent = `${imported.responsibilities || ""} ${imported.requirements || ""} ${imported.skills.join(" ")}`;

  return existingJobs
    .map((job) => {
      const similarity =
        exactSimilarity(imported.title, job.title) * 0.4 +
        exactSimilarity(imported.company, job.company) * 0.25 +
        exactSimilarity(imported.location, job.location) * 0.15 +
        textSimilarity(importedContent, `${job.description} ${job.requirements}`) * 0.2;
      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        similarity: Number(similarity.toFixed(3))
      };
    })
    .filter((job) => job.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

