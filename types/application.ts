export type ApplicationStage = "Applied" | "Under Review" | "Shortlisted" | "Interview" | "Offer" | "Rejected";

export type CandidateApplication = {
  id: string;
  candidateId: string;
  jobId: string;
  company: string;
  role: string;
  location: string;
  status: ApplicationStage;
  matchScore: number;
  recruiterNotes?: string;
  interviewInformation?: string;
  interviewReadinessScore?: number;
  offerInformation?: string;
  updatedAt: string;
  createdAt: string;
};

export type JobRecommendation = {
  id: string;
  title: string;
  company: string;
  location: string;
  workType: string;
  matchScore: number;
  salaryRange: string;
  matchedSkills: string[];
  missingSkills: string[];
  why: string;
};
