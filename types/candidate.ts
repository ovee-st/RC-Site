export type CandidateProfile = {
  id: string;
  userId?: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  experienceLevel: "Entry Level" | "Mid Level" | "Senior Level" | "Top-Level" | string;
  yearsExperience: number;
  avatarUrl?: string;
  bio: string;
  skills: string[];
  socials: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  resumeUrl?: string;
  profileCompletion: number;
  aiMatchScore: number;
  resumeScore: number;
};

export type CandidateDocument = {
  id: string;
  name: string;
  type: "Resume" | "Cover Letter" | "Certification" | "Portfolio";
  url: string;
  uploadedAt: string;
  score?: number;
};

export type SkillAssessment = {
  id: string;
  title: string;
  category: string;
  score: number;
  level: string;
  status: "Completed" | "Recommended" | "In Progress";
  summary: string;
};

export type InterviewEvent = {
  id: string;
  company: string;
  role: string;
  scheduledAt: string;
  meetingUrl: string;
  checklist: string[];
  feedback?: string;
};

export type CandidateNotification = {
  id: string;
  type: "application" | "interview" | "message" | "ai";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type RecruiterMessage = {
  id: string;
  recruiter: string;
  company: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Array<{
    id: string;
    sender: "candidate" | "recruiter";
    body: string;
    timestamp: string;
  }>;
};

export type CandidateAnalytics = {
  applicationSuccessRate: number;
  interviewsCompleted: number;
  recruiterResponseRate: number;
  profileViews: number;
  skillTrends: Array<{ skill: string; value: number }>;
  resumeScore?: number;
  atsOptimization?: number;
  experienceStrength?: number;
  skillsCoverage?: number;
  keywordMatch?: number;
};

