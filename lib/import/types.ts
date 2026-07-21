export type JobImportSourceType = "url" | "text";

export type ExtractedJobFields = {
  title: string | null;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryText: string | null;
  experience: string | null;
  education: string | null;
  vacancies: number | null;
  deadline: string | null;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  skills: string[];
  industry: string | null;
  department: string | null;
  jobLevel: string | null;
  workArrangement: string | null;
  applicationMethod: string | null;
  keywords: string[];
};

export type GeneratedJobFields = {
  seoTitle: string | null;
  metaDescription: string | null;
  summary: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  suggestedCategory: string | null;
  suggestedLocation: string | null;
  suggestedIndustry: string | null;
  suggestedKeywords: string[];
  shortRecruiterSummary: string | null;
};

export type DuplicateJobMatch = {
  id: string;
  title: string;
  company: string;
  location: string;
  similarity: number;
};

export type StructuredJobImportDto = {
  source: {
    type: JobImportSourceType;
    url: string | null;
    finalUrl: string | null;
  };
  extracted: ExtractedJobFields;
  generated: GeneratedJobFields;
  duplicates: DuplicateJobMatch[];
  warnings: string[];
  aiEnabled: boolean;
  contentPreview: string;
};

export type JobImportRequest = {
  sourceType: JobImportSourceType;
  url?: string;
  text?: string;
};

export type ExistingJobForDuplicateCheck = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string;
};

