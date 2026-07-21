export const TALENT_ENGAGEMENT_STATUSES = [
  "interested",
  "passive",
  "contacted",
  "interviewed",
  "offer_declined",
  "silver_medalist",
  "future_opportunity"
] as const;

export type TalentEngagementStatus = (typeof TALENT_ENGAGEMENT_STATUSES)[number];
export type ReferralStatus = "submitted" | "reviewing" | "interviewing" | "hired" | "rejected" | "withdrawn";
export type TalentMessageType = "outreach" | "interview_invitation" | "follow_up" | "rejection" | "offer" | "general";

export type TalentPoolDto = {
  id: string;
  name: string;
  description: string | null;
  visibility: "private" | "team";
  isArchived: boolean;
  memberCount: number;
  updatedAt: string;
};

export type TalentPoolMemberDto = {
  id: string;
  poolId: string;
  candidateId: string;
  candidateName: string;
  candidateTitle: string | null;
  candidateAvatar: string | null;
  engagementStatus: TalentEngagementStatus;
  tags: string[];
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
};

export type RediscoveryCandidateDto = {
  candidateId: string;
  applicationId: string | null;
  name: string;
  title: string | null;
  skills: string[];
  experience: string | null;
  latestStage: string | null;
  latestApplicationAt: string | null;
  rejectionReason: string | null;
  score: number;
  reasons: string[];
};

export type CareerPageDto = {
  id: string;
  slug: string;
  companyName: string;
  headline: string | null;
  mission: string | null;
  vision: string | null;
  values: string[];
  culture: string | null;
  benefits: string[];
  teamStories: Array<{ name: string; role: string; story: string }>;
  logoUrl: string | null;
  coverUrl: string | null;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  updatedAt: string;
};

export type TalentCrmMetrics = {
  totalPoolMembers: number;
  activePools: number;
  poolGrowth: number;
  referrals: number;
  referralConversion: number;
  careerPageViews: number;
  applicationConversion: number;
  messagesSent: number;
  sourceQuality: Array<{ source: string; candidates: number; hires: number; conversion: number }>;
};

export type OfferTemplateVariables = Record<string, string | number | null | undefined>;
