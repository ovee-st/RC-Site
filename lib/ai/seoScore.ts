import type { RecruitingJobInput, ScoreResult } from "@/lib/ai/recruitingTypes";
import { scoreBand } from "@/lib/ai/qualityScore";

export function calculateSeoScore(job: RecruitingJobInput): ScoreResult {
  let score = 0;
  const missing: string[] = [];
  const recommendations: string[] = [];

  if (job.seoTitle.length >= 30 && job.seoTitle.length <= 65) score += 15;
  else { missing.push("SEO title"); recommendations.push("Keep the SEO title between 30 and 65 characters."); }
  if (job.metaDescription.length >= 120 && job.metaDescription.length <= 160) score += 15;
  else { missing.push("Meta description"); recommendations.push("Write a 120-160 character meta description."); }
  if (job.keywords.length >= 5) score += 15;
  else { missing.push("Keywords"); recommendations.push("Add at least five specific search keywords."); }
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(job.slug)) score += 10;
  else { missing.push("URL slug"); recommendations.push("Use a concise, lowercase, hyphenated slug."); }
  if (job.summary.length >= 80 && job.summary.length <= 400) score += 15;
  else { missing.push("Job summary"); recommendations.push("Add a focused, readable job summary."); }
  if (job.title && job.location && job.company) score += 10;
  else recommendations.push("Include title, company, and location for search relevance.");
  if (job.category && job.industry) score += 5;
  else missing.push("Category or industry");
  if (job.responsibilities.includes("\n") || job.requirements.includes("\n")) score += 5;
  else recommendations.push("Break long job copy into readable sections or bullets.");
  if (job.internalLinks) score += 5;
  else { missing.push("Internal links"); recommendations.push("Link the published job to relevant company, category, and location pages."); }
  if (job.structuredData) score += 5;
  else { missing.push("Structured data"); recommendations.push("Include valid JobPosting structured data on the public job page."); }

  return { score, band: scoreBand(score), missing, recommendations };
}
