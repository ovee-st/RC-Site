export const DEFAULT_PIPELINE_STAGE_NAMES = [
  "Applied",
  "AI Reviewed",
  "Shortlisted",
  "Phone Screening",
  "Assessment",
  "Interview",
  "Final Interview",
  "Reference Check",
  "Offer",
  "Hired",
  "Rejected",
  "Archived"
] as const;

export type DefaultPipelineStageName = (typeof DEFAULT_PIPELINE_STAGE_NAMES)[number];
export type AtsTaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type InterviewType = "phone" | "video" | "onsite" | "panel" | "technical" | "hr" | "final";
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";
export type AssessmentStatus = "assigned" | "started" | "completed" | "expired";
export type OfferStatus = "draft" | "internal_approval" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "withdrawn";

export type PipelineStageDto = {
  id: string;
  pipelineId: string;
  name: string;
  slug: string;
  position: number;
  color: string;
  isTerminal: boolean;
  isArchived: boolean;
  candidateCount: number;
};

export type PipelineCandidateDto = {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidatePhoto: string | null;
  jobId: string;
  jobTitle: string;
  stageId: string;
  stageName: string;
  matchScore: number | null;
  status: string;
  recruiterId: string | null;
  recruiterName: string | null;
  applicationDate: string;
  tags: string[];
  stageEnteredAt: string;
};

export type PipelineDto = {
  id: string;
  name: string;
  employerUserId: string;
  stages: PipelineStageDto[];
  candidates: PipelineCandidateDto[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type TimelineEventDto = {
  id: string;
  applicationId: string;
  eventType: string;
  title: string;
  description: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type RecruiterDashboardDto = {
  applicationsToday: number;
  openInterviews: number;
  pendingTasks: number;
  activeOffers: number;
  hiringVelocityDays: number | null;
  averageTimeToHireDays: number | null;
  aiRecommendationAcceptance: number | null;
  pipelineFunnel: Array<{ stageId: string; stage: string; count: number; conversion: number }>;
  timeInStage: Array<{ stageId: string; stage: string; averageHours: number }>;
  sourceQuality: Array<{ source: string; applications: number; hires: number }>;
  recruiterWorkload: Array<{ recruiterId: string; recruiter: string; candidates: number; tasks: number }>;
};

export type AtsApiError = {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};
