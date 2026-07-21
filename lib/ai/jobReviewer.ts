import { calculateAtsScore } from "@/lib/ai/atsScore";
import { calculateQualityScore } from "@/lib/ai/qualityScore";
import { requestRecruitingJson } from "@/lib/ai/recruitingOpenAi";
import { RECRUITING_PROMPTS } from "@/lib/ai/recruitingPrompts";
import type { JobRecommendation, JobReviewResult, RecruiterSummary, RecruitingJobInput } from "@/lib/ai/recruitingTypes";
import { calculateSeoScore } from "@/lib/ai/seoScore";

const BUZZWORDS = ["rockstar", "ninja", "guru", "wizard", "superstar", "world-class", "fast-paced", "dynamic individual"];

function recommendation(id: string, field: string, severity: JobRecommendation["severity"], title: string, detail: string): JobRecommendation {
  return { id, field, severity, title, detail };
}

function repeatedSentences(value: string) {
  const sentences = value.toLowerCase().split(/[.!?\n]+/).map((item) => item.trim()).filter((item) => item.length > 20);
  return new Set(sentences).size < sentences.length;
}

export function deterministicRecommendations(job: RecruitingJobInput): JobRecommendation[] {
  const output: JobRecommendation[] = [];
  if (!job.salary) output.push(recommendation("missing-salary", "salary", "high", "Salary is missing", "Add a salary range when policy permits to improve applicant confidence."));
  if (job.title.length < 4 || job.title.length > 70 || BUZZWORDS.some((word) => job.title.toLowerCase().includes(word))) output.push(recommendation("weak-title", "title", "high", "Title needs focus", "Use a concise, conventional job title without promotional language."));
  if (job.skills.length < 5) output.push(recommendation("few-skills", "skills", "high", "Too few skills", "Include at least five specific capabilities supported by the source job."));
  if (job.responsibilities.length < 120) output.push(recommendation("short-responsibilities", "responsibilities", "high", "Responsibilities are too short", "Describe concrete outcomes and day-to-day ownership."));
  if (job.requirements.length < 80) output.push(recommendation("unclear-requirements", "requirements", "high", "Requirements need clarity", "Separate minimum experience, education, and practical capabilities."));
  if (!job.benefits) output.push(recommendation("missing-benefits", "benefits", "medium", "Benefits are missing", "Add only confirmed benefits or working conditions."));
  if (job.metaDescription.length < 120) output.push(recommendation("weak-seo", "metaDescription", "medium", "SEO metadata is weak", "Use a specific 120-160 character meta description."));
  const allCopy = `${job.summary} ${job.responsibilities} ${job.requirements}`;
  const buzzwords = BUZZWORDS.filter((word) => allCopy.toLowerCase().includes(word));
  if (buzzwords.length) output.push(recommendation("buzzwords", "readability", "low", "Reduce buzzwords", `Replace vague wording such as ${buzzwords.join(", ")} with concrete expectations.`));
  if (allCopy.split(/\n/).some((paragraph) => paragraph.length > 500)) output.push(recommendation("long-paragraphs", "readability", "medium", "Paragraphs are too long", "Break dense content into short paragraphs or bullets."));
  if (repeatedSentences(allCopy)) output.push(recommendation("duplicate-wording", "readability", "low", "Duplicate wording detected", "Remove repeated statements to keep the posting concise."));
  return output;
}

export function deterministicRecruiterSummary(job: RecruitingJobInput): RecruiterSummary {
  const topSkills = Array.from(new Set(job.skills)).slice(0, 10);
  const difficulty: RecruiterSummary["hiringDifficulty"] = topSkills.length >= 8 || /senior|lead|head|director/i.test(job.title) ? "High" : topSkills.length >= 5 ? "Moderate" : "Low";
  const availability: RecruiterSummary["candidateAvailability"] = difficulty === "High" ? "Limited" : difficulty === "Moderate" ? "Moderate" : "Strong";
  return {
    executiveSummary: `${job.title || "This role"}${job.company ? ` at ${job.company}` : ""}${job.location ? ` in ${job.location}` : ""}. ${job.summary || job.responsibilities}`.trim().slice(0, 420),
    idealCandidate: `A candidate with ${job.experience || "relevant experience"}${topSkills.length ? ` and practical capability in ${topSkills.slice(0, 5).join(", ")}` : ""}.`,
    topSkills,
    mostImportantRequirement: job.requirements.split(/\n|\.|;/).map((item) => item.trim()).find(Boolean) || "Clarify the primary minimum requirement.",
    biggestHiringChallenge: difficulty === "High" ? "Finding candidates who combine the required seniority with the full skill mix." : "Confirming practical capability against the role requirements.",
    hiringDifficulty: difficulty,
    candidateAvailability: availability
  };
}

type AiReview = {
  recommendations?: JobRecommendation[];
  recruiterSummary?: Partial<RecruiterSummary>;
};

export async function reviewJob(job: RecruitingJobInput): Promise<JobReviewResult> {
  const quality = calculateQualityScore(job);
  const ats = calculateAtsScore(job);
  const seo = calculateSeoScore(job);
  const fallbackRecommendations = deterministicRecommendations(job);
  const fallbackSummary = deterministicRecruiterSummary(job);
  const ai = await requestRecruitingJson<AiReview>(
    RECRUITING_PROMPTS.review,
    { job, deterministicScores: { quality, ats, seo }, expectedShape: { recommendations: [{ id: "string", field: "string", severity: "high|medium|low", title: "string", detail: "string" }], recruiterSummary: fallbackSummary } }
  );

  const aiRecommendations = Array.isArray(ai?.recommendations)
    ? ai.recommendations.filter((item) => item?.title && item?.detail).slice(0, 12)
    : [];
  const summary = ai?.recruiterSummary || {};
  return {
    quality,
    ats,
    seo,
    recommendations: aiRecommendations.length ? aiRecommendations : fallbackRecommendations,
    recruiterSummary: {
      executiveSummary: summary.executiveSummary || fallbackSummary.executiveSummary,
      idealCandidate: summary.idealCandidate || fallbackSummary.idealCandidate,
      topSkills: Array.isArray(summary.topSkills) ? summary.topSkills.slice(0, 10) : fallbackSummary.topSkills,
      mostImportantRequirement: summary.mostImportantRequirement || fallbackSummary.mostImportantRequirement,
      biggestHiringChallenge: summary.biggestHiringChallenge || fallbackSummary.biggestHiringChallenge,
      hiringDifficulty: new Set(["Low", "Moderate", "High"]).has(String(summary.hiringDifficulty)) ? summary.hiringDifficulty as RecruiterSummary["hiringDifficulty"] : fallbackSummary.hiringDifficulty,
      candidateAvailability: new Set(["Limited", "Moderate", "Strong"]).has(String(summary.candidateAvailability)) ? summary.candidateAvailability as RecruiterSummary["candidateAvailability"] : fallbackSummary.candidateAvailability
    },
    aiEnhanced: Boolean(ai)
  };
}
