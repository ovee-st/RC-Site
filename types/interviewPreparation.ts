export type InterviewQuestionType = "technical" | "behavioral" | "situational";
export type InterviewPreparationMode = "basic" | "mock";

export type InterviewQuestion = {
  id: string;
  type: InterviewQuestionType;
  question: string;
  focus: string;
  guidance: string;
};

export type InterviewAnswerFeedback = {
  id: string;
  questionId: string;
  answer: string;
  score: number | null;
  feedback: string | null;
  strengths: string[];
  improvements: string[];
  createdAt: string;
};

export type InterviewPreparationDto = {
  id: string;
  jobId: string;
  applicationId: string | null;
  jobTitle: string;
  companyName: string;
  mode: InterviewPreparationMode;
  status: "in_progress" | "completed";
  isPro: boolean;
  questionLimit: number | null;
  readinessScore: number;
  strengths: string[];
  missingSkills: string[];
  improvementAreas: string[];
  questions: InterviewQuestion[];
  answers: InterviewAnswerFeedback[];
  currentQuestion: number;
  createdAt: string;
  updatedAt: string;
};

export type AppliedJobPreparationDto = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: string;
  preparationId: string | null;
  readinessScore: number | null;
};
