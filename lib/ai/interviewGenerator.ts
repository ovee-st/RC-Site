import { requestRecruitingJson } from "@/lib/ai/recruitingOpenAi";
import { RECRUITING_PROMPTS } from "@/lib/ai/recruitingPrompts";
import type { InterviewPack, InterviewQuestion, RecruitingJobInput } from "@/lib/ai/recruitingTypes";

function question(questionText: string, category: InterviewQuestion["category"], purpose: string): InterviewQuestion {
  return { question: questionText, category, purpose };
}

export function deterministicInterviewPack(job: RecruitingJobInput): InterviewPack {
  const skills = job.skills.slice(0, 5);
  const technical = (skills.length ? skills : [job.category || "the role"]).map((skill) => question(`Describe a recent example where you applied ${skill} to solve a practical problem.`, "technical", `Validate practical ${skill} capability.`));
  return {
    technicalQuestions: technical,
    behavioralQuestions: [
      question("Tell us about a time you had to deliver an important result with incomplete information.", "behavioral", "Assess judgment and ownership."),
      question("Describe a disagreement with a stakeholder and how you resolved it.", "behavioral", "Assess communication and collaboration."),
      question("How do you prioritize when several deadlines compete?", "behavioral", "Assess prioritization discipline.")
    ],
    hrQuestions: [
      question(`Why are you interested in the ${job.title || "role"} opportunity?`, "hr", "Understand motivation."),
      question("What working environment helps you perform at your best?", "hr", "Assess environment alignment."),
      question("What are your expectations for your next role?", "hr", "Surface candidate expectations.")
    ],
    knockoutQuestions: [
      question(`Do you meet the stated experience requirement: ${job.experience || "the experience described in this job"}?`, "knockout", "Confirm minimum experience."),
      question(`Can you work under the stated arrangement: ${job.workArrangement || "the arrangement described in this job"}?`, "knockout", "Confirm working arrangement."),
      question(`Are you able to work from or serve the listed location: ${job.location || "the listed location"}?`, "knockout", "Confirm location compatibility.")
    ],
    scoringRubric: [
      { criterion: "Role knowledge", weight: 30, guidance: "Accuracy, depth, and application of job-related knowledge." },
      { criterion: "Evidence", weight: 25, guidance: "Specific examples with actions and measurable outcomes." },
      { criterion: "Problem solving", weight: 20, guidance: "Structured thinking, trade-offs, and judgment." },
      { criterion: "Communication", weight: 15, guidance: "Clear, concise, and audience-aware answers." },
      { criterion: "Motivation and fit", weight: 10, guidance: "Realistic motivation aligned with the role." }
    ],
    evaluationChecklist: ["Minimum requirements verified", "Core skills supported by evidence", "Examples are specific and credible", "Communication is clear", "Risks and follow-ups documented"],
    ratingMatrix: [
      { rating: 1, label: "Insufficient", description: "No relevant evidence or significant requirement gaps." },
      { rating: 2, label: "Developing", description: "Some relevant exposure but limited depth or evidence." },
      { rating: 3, label: "Competent", description: "Meets the requirement with credible examples." },
      { rating: 4, label: "Strong", description: "Exceeds the requirement with clear, repeatable results." },
      { rating: 5, label: "Exceptional", description: "Deep expertise, excellent judgment, and outstanding evidence." }
    ],
    aiEnhanced: false
  };
}

export async function generateInterviewPack(job: RecruitingJobInput): Promise<InterviewPack> {
  const fallback = deterministicInterviewPack(job);
  const ai = await requestRecruitingJson<Partial<InterviewPack>>(
    RECRUITING_PROMPTS.interview,
    { job, expectedShape: fallback }
  );
  if (!ai || !Array.isArray(ai.technicalQuestions) || !Array.isArray(ai.behavioralQuestions)) return fallback;
  return {
    technicalQuestions: ai.technicalQuestions.slice(0, 10) as InterviewQuestion[],
    behavioralQuestions: ai.behavioralQuestions.slice(0, 10) as InterviewQuestion[],
    hrQuestions: Array.isArray(ai.hrQuestions) ? ai.hrQuestions.slice(0, 10) as InterviewQuestion[] : fallback.hrQuestions,
    knockoutQuestions: Array.isArray(ai.knockoutQuestions) ? ai.knockoutQuestions.slice(0, 10) as InterviewQuestion[] : fallback.knockoutQuestions,
    scoringRubric: Array.isArray(ai.scoringRubric) ? ai.scoringRubric.slice(0, 10) : fallback.scoringRubric,
    evaluationChecklist: Array.isArray(ai.evaluationChecklist) ? ai.evaluationChecklist.slice(0, 15) : fallback.evaluationChecklist,
    ratingMatrix: Array.isArray(ai.ratingMatrix) ? ai.ratingMatrix.slice(0, 5) : fallback.ratingMatrix,
    aiEnhanced: true
  };
}
