import { afterEach, describe, expect, it } from "vitest";
import { calculateAtsScore } from "@/lib/ai/atsScore";
import { addHistoryVersion, compareHistoryVersions } from "@/lib/ai/history";
import { deterministicInterviewPack } from "@/lib/ai/interviewGenerator";
import { deterministicImprovement } from "@/lib/ai/jobImprover";
import { reviewJob } from "@/lib/ai/jobReviewer";
import { calculateQualityScore } from "@/lib/ai/qualityScore";
import type { RecruitingJobInput } from "@/lib/ai/recruitingTypes";
import { deterministicScreeningPack } from "@/lib/ai/screeningGenerator";
import { calculateSeoScore } from "@/lib/ai/seoScore";

const originalApiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalApiKey;
});

const job: RecruitingJobInput = {
  title: "Senior Software Engineer",
  company: "MX Venture Lab",
  location: "Dhaka",
  salary: "BDT 120,000 - 160,000",
  employmentType: "Full Time",
  experience: "5 years",
  education: "Bachelor's degree in Computer Science",
  responsibilities: "Lead application delivery across the full development lifecycle.\nBuild reliable TypeScript services and review production changes.\nCollaborate with product and design teams on measurable outcomes.",
  requirements: "At least five years of software engineering experience.\nStrong TypeScript, React, Node.js, PostgreSQL, and API design capability.",
  skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "API design"],
  benefits: "Health coverage\nLearning budget\nFlexible working hours",
  deadline: "2030-12-31",
  seoTitle: "Senior Software Engineer Jobs at MX Venture Lab",
  metaDescription: "Join MX Venture Lab as a Senior Software Engineer in Dhaka. Build reliable products with TypeScript, React, Node.js, and PostgreSQL expertise.",
  keywords: ["software engineer", "TypeScript", "React", "Node.js", "Dhaka jobs"],
  slug: "senior-software-engineer",
  summary: "Lead the design and delivery of reliable hiring technology while mentoring engineers and partnering with product teams.",
  category: "Software Development",
  industry: "Technology",
  workArrangement: "Hybrid",
  internalLinks: true,
  structuredData: true
};

describe("recruiting assistant scoring", () => {
  it("gives complete jobs strong quality, ATS, and SEO scores", () => {
    expect(calculateQualityScore(job).score).toBe(100);
    expect(calculateAtsScore(job).score).toBeGreaterThanOrEqual(80);
    expect(calculateSeoScore(job).score).toBeGreaterThanOrEqual(80);
  });

  it("reports missing fields and keywords deterministically", () => {
    const incomplete = { ...job, salary: "", benefits: "", skills: ["Kubernetes"], metaDescription: "Short" };
    expect(calculateQualityScore(incomplete).missing).toEqual(expect.arrayContaining(["Salary", "Benefits", "SEO metadata"]));
    expect(calculateAtsScore(incomplete).missingKeywords).toContain("Kubernetes");
    expect(calculateSeoScore(incomplete).missing).toContain("Meta description");
  });
});

describe("recruiting assistant generators", () => {
  it("changes only fields allowed by the selected improvement", () => {
    expect(Object.keys(deterministicImprovement(job, "seo").updates).sort()).toEqual(["keywords", "metaDescription", "seoTitle"]);
    expect(Object.keys(deterministicImprovement(job, "requirements").updates)).toEqual(["requirements"]);
  });

  it("creates a complete deterministic interview and screening pack", () => {
    const interview = deterministicInterviewPack(job);
    const screening = deterministicScreeningPack(job);
    expect(interview.technicalQuestions.length).toBeGreaterThanOrEqual(5);
    expect(interview.ratingMatrix).toHaveLength(5);
    expect(screening.requiredQuestions.some((question) => question.type === "multiple_choice")).toBe(true);
    expect(screening.optionalQuestions.some((question) => question.type === "short_answer")).toBe(true);
  });

  it("returns a full review without OpenAI", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await reviewJob(job);
    expect(result.aiEnhanced).toBe(false);
    expect(result.recruiterSummary.topSkills).toContain("TypeScript");
    expect(result.quality.score).toBe(100);
  });
});

describe("recruiting assistant history", () => {
  it("stores, compares, and caps immutable draft versions", () => {
    let history = addHistoryVersion([], "Original Import", { title: "Engineer", salary: "" });
    history = addHistoryVersion(history, "AI Improved", { title: "Senior Engineer", salary: "1000" });
    const changes = compareHistoryVersions(history[1], history[0]);
    expect(changes).toEqual(expect.arrayContaining([{ field: "title", before: "Engineer", after: "Senior Engineer" }]));
    for (let index = 0; index < 25; index += 1) history = addHistoryVersion(history, "Recruiter Edited", { title: `Role ${index}`, salary: "1000" });
    expect(history).toHaveLength(20);
    expect(history.some((version) => version.kind === "Original Import")).toBe(true);
  });
});
