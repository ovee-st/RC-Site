import { requestRecruitingJson } from "@/lib/ai/recruitingOpenAi";
import { RECRUITING_PROMPTS } from "@/lib/ai/recruitingPrompts";
import type { ImproveAction, JobImprovementResult, RecruitingJobInput } from "@/lib/ai/recruitingTypes";

function clean(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function bullets(value: string) {
  return Array.from(new Set(value.split(/\n|[.;](?:\s+|$)/).map(clean).filter((item) => item.length > 3))).slice(0, 12).map((item) => `- ${item}`).join("\n");
}

export function deterministicImprovement(job: RecruitingJobInput, action: ImproveAction): JobImprovementResult {
  const base: JobImprovementResult = { action, updates: {}, aiEnhanced: false };
  if (action === "title") base.updates.title = clean(job.title).replace(/\b(rockstar|ninja|guru|wizard|superstar)\b/gi, "").replace(/\s+/g, " ").trim();
  if (action === "description" || action === "readability") base.updates.summary = clean(job.summary || job.responsibilities).slice(0, 420);
  if (action === "requirements") base.updates.requirements = bullets(job.requirements);
  if (action === "responsibilities") base.updates.responsibilities = bullets(job.responsibilities);
  if (action === "benefits") base.updates.benefits = bullets(job.benefits);
  if (action === "skills") base.updates.skills = Array.from(new Set(job.skills.map(clean).filter(Boolean))).slice(0, 15);
  if (action === "seo") {
    base.updates.seoTitle = `${job.title}${job.company ? ` at ${job.company}` : ""}`.slice(0, 65);
    base.updates.metaDescription = `${job.title}${job.company ? ` at ${job.company}` : ""}${job.location ? ` in ${job.location}` : ""}. Review responsibilities, requirements, skills, and application details.`.slice(0, 160);
    base.updates.keywords = Array.from(new Set([job.title, `${job.title} jobs`, job.company, job.location, job.category, job.industry, ...job.skills].map(clean).filter(Boolean))).slice(0, 15);
  }
  if (action === "ats") {
    const missingInCopy = job.skills.filter((skill) => !`${job.summary} ${job.requirements}`.toLowerCase().includes(skill.toLowerCase()));
    base.updates.summary = clean(`${job.summary} ${missingInCopy.length ? `Core skills include ${missingInCopy.join(", ")}.` : ""}`).slice(0, 500);
  }
  return base;
}

export async function improveJob(job: RecruitingJobInput, action: ImproveAction): Promise<JobImprovementResult> {
  const fallback = deterministicImprovement(job, action);
  const ai = await requestRecruitingJson<{ updates?: JobImprovementResult["updates"] }>(
    RECRUITING_PROMPTS.improve(action),
    { action, job, allowedUpdateFields: Object.keys(fallback.updates) }
  );
  if (!ai?.updates || typeof ai.updates !== "object") return fallback;
  const allowed = new Set(Object.keys(fallback.updates));
  const updates = Object.fromEntries(Object.entries(ai.updates).filter(([key]) => allowed.has(key))) as JobImprovementResult["updates"];
  return Object.keys(updates).length ? { action, updates, aiEnhanced: true } : fallback;
}
