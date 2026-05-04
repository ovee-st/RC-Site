export type UserRole = "guest" | "candidate" | "employer";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  experience: string;
  jobType: string;
  workType?: "On-site" | "Hybrid" | "Remote" | string;
  experienceYears?: string;
  hideSalary?: boolean;
  deadline?: string;
  bannerUrl?: string | null;
  status?: "active" | "archived" | "hired";
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  description: string;
  requirements: string;
  embedding?: number[];
  createdAt?: string;
};

export type Candidate = {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  category: string;
  experience: string;
  skills: string[];
  profile: string;
  embedding?: number[];
};

export type MatchResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  semanticScore: number;
  breakdown: {
    skills: number;
    experience: number;
    semantic: number;
    industry: number;
  };
};

export type Application = {
  id: string;
  jobId: string;
  candidateId: string;
  name: string;
  avatar?: string;
  title: string;
  matchScore: number;
  status: "Applied" | "Shortlisted" | "Interview" | "Offer" | "Hired";
  skills: string[];
};

export type Notification = {
  id: string;
  type: "shortlisted" | "interview" | "hired";
  title: string;
  message: string;
  isRead: boolean;
};
