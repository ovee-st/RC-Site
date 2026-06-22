import type { InterviewQuestion, InterviewQuestionType } from "@/types/interviewPreparation";

type InterviewJobContext = {
  title: string;
  description: string;
  requirements: string;
  skills: string[];
};

type CandidateContext = {
  skills: string[];
  title?: string;
  about?: string;
  experience?: unknown;
};

export function normalizeSkillList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return Array.from(new Set(values.map((skill) => String(skill).trim()).filter(Boolean)));
}

export function analyzeInterviewFit(candidate: CandidateContext, job: InterviewJobContext) {
  const candidateSkills = normalizeSkillList(candidate.skills);
  const requiredSkills = normalizeSkillList(job.skills);
  const candidateIndex = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const strengths = requiredSkills.filter((skill) => candidateIndex.has(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !candidateIndex.has(skill.toLowerCase()));
  const coverage = requiredSkills.length ? strengths.length / requiredSkills.length : 0.6;
  const profileSignals = [candidate.title, candidate.about, candidate.experience].filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(String(value || "").trim());
  }).length;
  const readinessScore = Math.max(20, Math.min(95, Math.round(35 + coverage * 50 + profileSignals * 3)));
  const improvementAreas = [
    missingSkills.length ? `Build evidence for ${missingSkills.slice(0, 3).join(", ")}.` : "Prepare measurable examples for your strongest role-specific skills.",
    "Practice concise STAR answers with a clear situation, action, and result.",
    `Connect your experience directly to the priorities of the ${job.title} role.`
  ];

  return {
    readinessScore,
    strengths: strengths.length ? strengths : candidateSkills.slice(0, 4),
    missingSkills,
    improvementAreas
  };
}

function makeQuestion(type: InterviewQuestionType, index: number, question: string, focus: string, guidance: string): InterviewQuestion {
  return { id: `${type}-${index + 1}`, type, question, focus, guidance };
}

export function generateFallbackInterviewQuestions(job: InterviewJobContext, limit = 15): InterviewQuestion[] {
  const skills = normalizeSkillList(job.skills);
  const primarySkill = skills[0] || "the role's core responsibilities";
  const secondarySkill = skills[1] || "cross-functional collaboration";
  const technical = [
    `How would you apply ${primarySkill} in your first 30 days as ${job.title}?`,
    `Walk me through a difficult problem you solved using ${secondarySkill}.`,
    `Which metrics would you use to measure success in this ${job.title} role?`,
    `What common mistakes do professionals make when working with ${primarySkill}, and how do you avoid them?`,
    `Describe the tools, process, and quality checks you would use for this role.`
  ].map((question, index) => makeQuestion("technical", index, question, skills[index % Math.max(1, skills.length)] || primarySkill, "Use a concrete example, explain your decisions, and finish with a measurable result."));
  const behavioral = [
    "Tell me about a time you took ownership of an important task with limited direction.",
    "Describe a disagreement with a stakeholder and how you resolved it.",
    "Give an example of a deadline you nearly missed. What did you change?",
    "Tell me about feedback that changed how you work.",
    "Describe a result you are proud of and your personal contribution to it."
  ].map((question, index) => makeQuestion("behavioral", index, question, "STAR communication", "Keep the situation brief, emphasize your actions, and quantify the outcome."));
  const situational = [
    `You join as ${job.title} and discover conflicting priorities. What do you do first?`,
    `A critical task involving ${primarySkill} is behind schedule. How would you recover it?`,
    "A stakeholder rejects your recommendation without explanation. How do you respond?",
    "You notice a recurring quality issue that is outside your formal ownership. What would you do?",
    "Your manager asks for a fast decision with incomplete information. How do you proceed?"
  ].map((question, index) => makeQuestion("situational", index, question, "Judgment and prioritization", "State your assumptions, prioritize risk, communicate early, and explain the trade-offs."));

  const balanced = [technical[0], behavioral[0], situational[0], technical[1], behavioral[1], situational[1], ...technical.slice(2), ...behavioral.slice(2), ...situational.slice(2)];
  return balanced.slice(0, Math.max(1, limit));
}

export function scoreInterviewAnswer(answer: string, question: InterviewQuestion) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const resultSignals = /%|increased|reduced|improved|saved|result|outcome|delivered|achieved/i.test(answer);
  const actionSignals = /I (led|created|managed|built|resolved|coordinated|implemented|decided)/i.test(answer);
  const structureSignals = /situation|task|action|result|first|then|finally/i.test(answer);
  const score = Math.max(20, Math.min(95, 35 + Math.min(30, Math.floor(words.length / 3)) + (resultSignals ? 12 : 0) + (actionSignals ? 10 : 0) + (structureSignals ? 8 : 0)));
  const strengths = [
    words.length >= 60 ? "Answer has useful depth." : "Answer stays concise.",
    resultSignals ? "Includes an outcome or measurable result." : "Addresses the question directly."
  ];
  const improvements = [
    !actionSignals ? "Clarify your personal actions rather than only describing the team." : "Explain one difficult decision and why you made it.",
    !resultSignals ? "Finish with a measurable result or lesson learned." : `Connect the example more explicitly to ${question.focus}.`
  ];
  const technicalScore = question.type === "technical" ? score : Math.max(35, score - 8);
  const behavioralScore = question.type === "behavioral" ? score : Math.max(35, score - 5);
  const communicationScore = Math.max(25, Math.min(95, score + (structureSignals ? 4 : -4)));
  return {
    score,
    technicalScore,
    behavioralScore,
    communicationScore,
    strengths,
    improvements,
    suggestedImprovement: improvements[0],
    feedback: `Your answer is ${score >= 75 ? "interview-ready" : "a useful draft"}. ${improvements[0]}`
  };
}
