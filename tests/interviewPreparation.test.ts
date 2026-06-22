import { describe, expect, it } from "vitest";
import { analyzeInterviewFit, generateFallbackInterviewQuestions, scoreInterviewAnswer } from "@/lib/interviewPreparation";

const job = {
  title: "Frontend Developer",
  description: "Build responsive product interfaces.",
  requirements: "React, TypeScript, API integration, and communication.",
  skills: ["React", "TypeScript", "API", "Communication"]
};

describe("job-specific interview preparation", () => {
  it("limits free preparation to five balanced questions", () => {
    const questions = generateFallbackInterviewQuestions(job, 5);
    expect(questions).toHaveLength(5);
    expect(new Set(questions.map((question) => question.type))).toEqual(new Set(["technical", "behavioral", "situational"]));
  });

  it("creates an expanded Pro question set", () => {
    const questions = generateFallbackInterviewQuestions(job, 15);
    expect(questions).toHaveLength(15);
    expect(questions.filter((question) => question.type === "technical")).toHaveLength(5);
    expect(questions.filter((question) => question.type === "behavioral")).toHaveLength(5);
    expect(questions.filter((question) => question.type === "situational")).toHaveLength(5);
  });

  it("compares candidate skills with job requirements", () => {
    const fit = analyzeInterviewFit({ skills: ["React", "Communication"], title: "UI Developer", about: "Product UI experience" }, job);
    expect(fit.strengths).toEqual(["React", "Communication"]);
    expect(fit.missingSkills).toEqual(["TypeScript", "API"]);
    expect(fit.readinessScore).toBeGreaterThan(50);
    expect(fit.improvementAreas).toHaveLength(3);
  });

  it("rewards structured answers with actions and results", () => {
    const question = generateFallbackInterviewQuestions(job, 1)[0];
    const basic = scoreInterviewAnswer("I worked on the task and helped the team complete it on time.", question);
    const strong = scoreInterviewAnswer("The situation involved a delayed release. I led the recovery plan, coordinated the API work, and reduced defects by 30%. The result was an on-time launch.", question);
    expect(strong.score).toBeGreaterThan(basic.score);
    expect(strong.strengths.join(" ")).toMatch(/result/i);
    expect(strong.technicalScore).toBeGreaterThan(0);
    expect(strong.behavioralScore).toBeGreaterThan(0);
    expect(strong.communicationScore).toBeGreaterThan(0);
    expect(strong.suggestedImprovement).toBeTruthy();
  });
});
