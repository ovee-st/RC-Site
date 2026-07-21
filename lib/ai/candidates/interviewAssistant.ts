import type { CandidateJob, InterviewQuestion, ParsedResume } from "@/lib/ai/candidates/types";

export function generateCandidateInterview(resume: ParsedResume, job: CandidateJob): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  job.skills.slice(0, 5).forEach((skill) => {
    const mentioned = resume.skills.value.some((item) => item.toLowerCase() === skill.toLowerCase());
    questions.push({ category: mentioned ? "technical" : "clarification", question: mentioned ? `Describe a recent result where you applied ${skill}.` : `${skill} is not mentioned in the resume. What relevant experience, if any, do you have with it?`, evidence: mentioned ? resume.skills.evidence : [], reason: mentioned ? "Validate depth of an explicitly mentioned skill." : "Clarify an unknown without assuming the skill is absent." });
  });
  questions.push({ category: "behavioral", question: "Describe a difficult work problem, the evidence you considered, and the outcome.", evidence: resume.achievements.evidence, reason: "Assess evidence-based problem solving." });
  if (!resume.employmentHistory.value.length) questions.push({ category: "red_flag", question: "Please walk us through your employment history and the dates for each role.", evidence: [], reason: "Employment dates were not available for verification." });
  return questions;
}
