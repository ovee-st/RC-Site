export type RecruitingJobInput = {
  title: string;
  company: string;
  location: string;
  salary: string;
  employmentType: string;
  experience: string;
  education: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  benefits: string;
  deadline: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
  summary: string;
  category: string;
  industry: string;
  workArrangement: string;
  internalLinks: boolean;
  structuredData: boolean;
};

export type ScoreBand = "Excellent" | "Good" | "Fair" | "Needs Improvement";

export type ScoreResult = {
  score: number;
  band: ScoreBand;
  missing: string[];
  recommendations: string[];
};

export type JobRecommendation = {
  id: string;
  field: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export type RecruiterSummary = {
  executiveSummary: string;
  idealCandidate: string;
  topSkills: string[];
  mostImportantRequirement: string;
  biggestHiringChallenge: string;
  hiringDifficulty: "Low" | "Moderate" | "High";
  candidateAvailability: "Limited" | "Moderate" | "Strong";
};

export type JobReviewResult = {
  quality: ScoreResult;
  ats: ScoreResult & { missingKeywords: string[] };
  seo: ScoreResult;
  recommendations: JobRecommendation[];
  recruiterSummary: RecruiterSummary;
  aiEnhanced: boolean;
};

export type ImproveAction = "title" | "description" | "requirements" | "responsibilities" | "benefits" | "skills" | "seo" | "readability" | "ats";

export type JobImprovementResult = {
  action: ImproveAction;
  updates: Partial<{
    title: string;
    summary: string;
    requirements: string;
    responsibilities: string;
    benefits: string;
    skills: string[];
    seoTitle: string;
    metaDescription: string;
    keywords: string[];
  }>;
  aiEnhanced: boolean;
};

export type InterviewQuestion = {
  question: string;
  category: "technical" | "behavioral" | "hr" | "knockout";
  purpose: string;
};

export type InterviewPack = {
  technicalQuestions: InterviewQuestion[];
  behavioralQuestions: InterviewQuestion[];
  hrQuestions: InterviewQuestion[];
  knockoutQuestions: InterviewQuestion[];
  scoringRubric: Array<{ criterion: string; weight: number; guidance: string }>;
  evaluationChecklist: string[];
  ratingMatrix: Array<{ rating: number; label: string; description: string }>;
  aiEnhanced: boolean;
};

export type ScreeningQuestion = {
  id: string;
  type: "yes_no" | "multiple_choice" | "short_answer";
  question: string;
  required: boolean;
  options?: string[];
  idealAnswer?: string;
};

export type ScreeningPack = {
  requiredQuestions: ScreeningQuestion[];
  optionalQuestions: ScreeningQuestion[];
  aiEnhanced: boolean;
};
