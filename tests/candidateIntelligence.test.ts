import { afterEach, describe, expect, it } from "vitest";
import { calculateConfidence, confidenceFromScore } from "@/lib/ai/candidates/confidenceEngine";
import { compareCandidateMatches } from "@/lib/ai/candidates/comparison";
import { searchCandidates } from "@/lib/ai/candidates/copilot";
import { onlyGroundedEvidence, sanitizeResumeText } from "@/lib/ai/candidates/evidenceEngine";
import { generateCandidateInterview } from "@/lib/ai/candidates/interviewAssistant";
import { matchCandidateEvidence } from "@/lib/ai/candidates/matchEngine";
import { profileCandidate, profileCandidateWithAi } from "@/lib/ai/candidates/candidateProfiler";
import { extractResumeText, parseResumeText } from "@/lib/ai/candidates/resumeParser";
import type { CandidateJob } from "@/lib/ai/candidates/types";
import { detectUnknowns } from "@/lib/ai/candidates/unknownDetector";

const resumeText = `Amina Rahman
880 1712345678 | amina@example.com | Dhaka
Gender: Female
Nationality: Bangladeshi
LinkedIn: https://www.linkedin.com/in/amina-rahman

Professional Experience
Senior Software Engineer at Example Ltd | 2021 - Present
Led a team of 6 engineers and improved API response time by 35%.
Built TypeScript, React, Node.js, PostgreSQL, and Docker services.

Education
Bachelor of Science in Computer Science

Skills
TypeScript; React; Node.js; PostgreSQL; Docker; Communication; Leadership

Languages
English; Bangla

Certifications
AWS Certified Developer`;
const originalApiKey = process.env.OPENAI_API_KEY;
afterEach(() => { if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalApiKey; });

const job: CandidateJob = {
  id: "job-1", title: "Senior Software Engineer", skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Kubernetes"], experience: "5 years senior software engineering", education: "Bachelor Computer Science", industry: "Technology", location: "Dhaka", salary: "", languages: ["English"], certifications: ["AWS Certified Developer"], employmentType: "Full Time", description: "Build reliable services", requirements: "Five years of engineering experience"
};

describe("resume parser and evidence engine", () => {
  it("extracts resume fields with grounded evidence", () => {
    const resume = parseResumeText(resumeText, "amina.txt");
    expect(resume.name.value).toBe("Amina Rahman");
    expect(resume.email.value).toBe("amina@example.com");
    expect(resume.skills.value).toEqual(expect.arrayContaining(["TypeScript", "React", "PostgreSQL"]));
    expect(resume.email.evidence[0].quote).toContain("amina@example.com");
  });

  it("supports TXT buffer extraction", async () => {
    expect(await extractResumeText(Buffer.from(resumeText), "resume.txt", "text/plain")).toContain("Amina Rahman");
  });

  it("removes protected attributes before analysis", () => {
    const sanitized = sanitizeResumeText(resumeText);
    expect(sanitized).not.toMatch(/Gender|Nationality|Female|Bangladeshi/);
    expect(sanitized).toContain("TypeScript");
  });

  it("never accepts fabricated evidence", () => {
    expect(onlyGroundedEvidence("Candidate knows SQL", [{ id: "1", field: "skills", quote: "Managed 50 people", source: "Resume", confidence: 90 }])).toEqual([]);
  });
});

describe("confidence and unknown engines", () => {
  it("calculates bounded confidence levels", () => {
    expect(confidenceFromScore(92)).toEqual({ score: 92, level: "High" });
    expect(calculateConfidence({ evidenceQuality: 20, completeness: 10, consistency: 30, aiCertainty: 20 }).level).toBe("Low");
  });

  it("reports unavailable information without inventing it", () => {
    expect(detectUnknowns({ salary: "", skills: ["SQL"], certification: null })).toEqual(expect.arrayContaining([{ field: "salary", reason: "Not found in resume" }, { field: "certification", reason: "Not found in resume" }]));
  });
});

describe("evidence-based candidate intelligence", () => {
  it("scores job dimensions and labels missing skills as Not Mentioned", () => {
    const match = matchCandidateEvidence(parseResumeText(resumeText), job, 50);
    expect(match.score).toBeGreaterThan(50);
    expect(match.skillGap.notMentioned).toContain("Kubernetes");
    expect(["Strong Hire", "Interview", "Keep in Pipeline", "Need More Information"]).toContain(match.recommendation);
    expect(match.recommendation).not.toBe("Reject");
  });

  it("forces Need More Information below the human review threshold", () => {
    const match = matchCandidateEvidence(parseResumeText("Unknown Candidate"), job, 70);
    expect(match.humanReviewRequired).toBe(true);
    expect(match.recommendation).toBe("Need More Information");
    expect(match.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it("keeps profile insights and interview questions tied to evidence or unknowns", () => {
    const resume = parseResumeText(resumeText);
    const profile = profileCandidate(resume);
    const questions = generateCandidateInterview(resume, job);
    expect(profile.strengths.every((item) => item.evidence.length || item.unknowns.length)).toBe(true);
    expect(questions.some((item) => item.question.includes("Kubernetes") && item.category === "clarification")).toBe(true);
  });

  it("uses the deterministic evidence profile when AI is unavailable", async () => {
    delete process.env.OPENAI_API_KEY;
    const profile = await profileCandidateWithAi(parseResumeText(resumeText));
    expect(profile.model).toBe("deterministic-evidence-v1");
    expect(profile.professionalSummary.evidence.length).toBeGreaterThan(0);
  });

  it("does not declare a comparison winner when confidence is inadequate", () => {
    const low = matchCandidateEvidence(parseResumeText("Candidate One"), job, 70);
    const comparison = compareCandidateMatches([{ candidateId: "1", candidateName: "One", match: low }, { candidateId: "2", candidateName: "Two", match: low }]);
    expect(comparison.winner).toBeNull();
    expect(comparison.humanReviewRequired).toBe(true);
  });

  it("blocks protected-characteristic copilot searches", () => {
    expect(() => searchCandidates("find female candidates", [])).toThrow(/protected characteristics/i);
    expect(searchCandidates("find SQL developers", [{ id: "1", name: "Candidate", title: "Developer", skills: ["SQL"], profile: "Backend developer" }])[0].why).toContain("sql");
  });
});
