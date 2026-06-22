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
  status: "draft" | "submitted";
  score: number | null;
  technicalScore: number | null;
  behavioralScore: number | null;
  communicationScore: number | null;
  feedback: string | null;
  suggestedImprovement: string | null;
  strengths: string[];
  improvements: string[];
  createdAt: string;
};

export type InterviewScoreReport = {
  technicalScore: number;
  behavioralScore: number;
  communicationScore: number;
  overallReadinessScore: number;
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
  submittedAnswers: number;
  remainingQuestions: number;
  completionPercentage: number;
  freeSubmissionLimit: number | null;
  report: InterviewScoreReport;
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
