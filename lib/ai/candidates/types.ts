export type ConfidenceLevel = "High" | "Medium" | "Low";
export type HiringRecommendation = "Strong Hire" | "Interview" | "Keep in Pipeline" | "Need More Information";

export type Confidence = { score: number; level: ConfidenceLevel };
export type EvidenceReference = { id: string; field: string; quote: string; source: string; page?: number; confidence: number };
export type Unknown = { field: string; reason: string };
export type EvidenceValue<T> = { value: T; confidence: Confidence; evidence: EvidenceReference[]; unknowns: Unknown[] };

export type ResumeRole = { company: string; position: string; startDate?: string; endDate?: string; description: string };
export type ParsedResume = {
  fileName: string;
  rawText: string;
  name: EvidenceValue<string>;
  email: EvidenceValue<string>;
  phone: EvidenceValue<string>;
  location: EvidenceValue<string>;
  employmentHistory: EvidenceValue<ResumeRole[]>;
  education: EvidenceValue<string[]>;
  skills: EvidenceValue<string[]>;
  languages: EvidenceValue<string[]>;
  projects: EvidenceValue<string[]>;
  achievements: EvidenceValue<string[]>;
  certifications: EvidenceValue<string[]>;
  portfolio: EvidenceValue<string>;
  linkedin: EvidenceValue<string>;
  github: EvidenceValue<string>;
  currentCompany: EvidenceValue<string>;
  currentPosition: EvidenceValue<string>;
};

export type CandidateInsight = { title: string; statement: string; evidence: EvidenceReference[]; confidence: Confidence; unknowns: Unknown[]; reasoning: string };
export type CandidateProfileAnalysis = {
  professionalSummary: CandidateInsight;
  careerHighlights: CandidateInsight[];
  leadership: CandidateInsight;
  technicalStrengths: CandidateInsight[];
  softSkills: CandidateInsight[];
  industryExperience: CandidateInsight;
  managementExperience: CandidateInsight;
  careerProgression: CandidateInsight;
  strengths: CandidateInsight[];
  risks: RiskObservation[];
  unknowns: Unknown[];
  parsedResume: ParsedResume;
  promptVersion: string;
  model: string;
};

export type RiskObservation = CandidateInsight & { alternativeExplanation: string };
export type MatchDimension = { name: string; score: number; evidence: EvidenceReference[]; confidence: Confidence; unknowns: Unknown[]; reasoning: string };
export type SkillGapResult = { requiredSkills: string[]; candidateSkills: string[]; transferableSkills: string[]; notMentioned: string[]; learningRecommendations: string[] };
export type CandidateMatch = {
  score: number;
  dimensions: MatchDimension[];
  skillGap: SkillGapResult;
  recommendation: HiringRecommendation;
  evidence: EvidenceReference[];
  confidence: Confidence;
  unknowns: Unknown[];
  reasoning: string;
  humanReviewRequired: boolean;
  suggestedQuestions: string[];
  suggestedDocuments: string[];
};

export type CandidateJob = { id?: string; title: string; skills: string[]; experience: string; education: string; industry: string; location: string; salary: string; languages: string[]; certifications: string[]; employmentType: string; description: string; requirements: string };
export type CandidateComparison = { winner: string | null; candidates: Array<{ candidateId: string; candidateName: string; match: CandidateMatch }>; evidence: EvidenceReference[]; confidence: Confidence; unknowns: Unknown[]; reasoning: string; humanReviewRequired: boolean };
export type InterviewQuestion = { category: "behavioral" | "technical" | "clarification" | "red_flag"; question: string; evidence: EvidenceReference[]; reason: string };
export type TimelineEvent = { id: string; event: "Resume Uploaded" | "Resume Parsed" | "AI Analysis" | "AI Version" | "Recruiter Review" | "Interview" | "Offer" | "Decision"; timestamp: string; actorType: "system" | "ai" | "human"; metadata: Record<string, unknown> };
