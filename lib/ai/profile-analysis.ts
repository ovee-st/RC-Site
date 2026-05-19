export type ProfileAnalysisInput = {
  name?: string;
  title?: string;
  location?: string;
  about?: string;
  bio?: string;
  skills?: string[];
  experience?: Array<{ role?: string; company?: string; description?: string; period?: string }>;
  education?: Array<{ degree?: string; institution?: string; year?: string }>;
  certifications?: Array<{ name?: string; organization?: string; year?: string }>;
  salary?: { current?: string; expected?: string };
  availability?: { immediate?: boolean; noticePeriod?: string; noticeUnit?: string };
  profileCompletion?: number;
  resumeScore?: number;
};

export type ProfileAnalysis = {
  profileCompletionScore: number;
  atsScore: number;
  missingSkills: string[];
  missingSections: string[];
  recommendations: string[];
};

const CORE_SKILLS = ["Communication", "Leadership", "Excel", "Reporting", "Coordination", "Problem Solving"];

function hasText(value?: string) {
  return Boolean(value && value.trim().length > 2);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeCandidateProfile(profile: ProfileAnalysisInput): ProfileAnalysis {
  const bio = profile.about ?? profile.bio ?? "";
  const sections = [
    { key: "Professional title", done: hasText(profile.title) },
    { key: "About summary", done: hasText(bio) && bio.length > 80 },
    { key: "Skills", done: Boolean(profile.skills?.length && profile.skills.length >= 4) },
    { key: "Experience", done: Boolean(profile.experience?.length && profile.experience.some((item) => hasText(item.description) || hasText(item.role))) },
    { key: "Education", done: Boolean(profile.education?.length && profile.education.some((item) => hasText(item.degree))) },
    { key: "Certifications", done: Boolean(profile.certifications?.length) },
    { key: "Salary preference", done: Boolean(profile.salary?.expected) },
    { key: "Availability", done: Boolean(profile.availability?.immediate || profile.availability?.noticePeriod) }
  ];

  const completed = sections.filter((section) => section.done).length;
  const profileCompletionScore = clampScore(profile.profileCompletion ?? (completed / sections.length) * 100);
  const skillSet = new Set((profile.skills ?? []).map((skill) => skill.toLowerCase()));
  const missingSkills = CORE_SKILLS.filter((skill) => !skillSet.has(skill.toLowerCase())).slice(0, 4);
  const missingSections = sections.filter((section) => !section.done).map((section) => section.key);

  const summaryBonus = hasText(bio) ? Math.min(16, Math.floor(bio.length / 28)) : 0;
  const skillBonus = Math.min(28, (profile.skills?.length ?? 0) * 4);
  const experienceBonus = profile.experience?.length ? 18 : 0;
  const educationBonus = profile.education?.length ? 10 : 0;
  const atsScore = clampScore(profile.resumeScore ?? 34 + summaryBonus + skillBonus + experienceBonus + educationBonus - missingSections.length * 2);

  const recommendations = [
    missingSections.includes("About summary") ? "Add a sharper 3-4 line professional summary with role, years of experience, tools, and measurable outcomes." : "Your summary is present. Improve it further with 2-3 measurable business outcomes.",
    missingSkills.length ? `Add or validate high-signal skills such as ${missingSkills.slice(0, 3).join(", ")}.` : "Your skill set is strong. Keep the most relevant skills near the top of your profile.",
    profile.experience?.length ? "Rewrite experience bullets with action, metric, and impact so recruiters can scan faster." : "Add at least one recent experience entry with responsibilities, tools, and achievements.",
    "Tailor your CV keywords to the job category before applying to improve ATS ranking."
  ];

  return { profileCompletionScore, atsScore, missingSkills, missingSections, recommendations };
}
