export type MatchInput = {
  candidateSkills: string[];
  jobSkills: string[];
  candidateProfile: string;
  jobDescription: string;
};

export function calculateStructuredFit(input: MatchInput) {
  const candidateSkills = input.candidateSkills.map((skill) => skill.toLowerCase());
  const jobSkills = input.jobSkills.map((skill) => skill.toLowerCase());
  const matchedSkills = input.jobSkills.filter((skill) => candidateSkills.includes(skill.toLowerCase()));
  const missingSkills = input.jobSkills.filter((skill) => !candidateSkills.includes(skill.toLowerCase()));
  const skillScore = jobSkills.length ? Math.round((matchedSkills.length / jobSkills.length) * 70) : 45;
  const textOverlap = input.jobDescription
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3 && input.candidateProfile.toLowerCase().includes(word)).length;
  const semanticScore = Math.min(30, textOverlap * 3);

  return {
    score: Math.min(100, skillScore + semanticScore),
    matchedSkills,
    missingSkills,
    breakdown: {
      skills: skillScore,
      semantic: semanticScore,
      experience: Math.min(20, Math.round((skillScore + semanticScore) / 5)),
      industry: matchedSkills.length ? 10 : 4
    }
  };
}

export async function getCareerAssistantReply(prompt: string) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return `Based on your profile, focus on one stronger proof point for: ${prompt}. Add measurable outcomes, keep the resume ATS-safe, and prepare two STAR stories for interviews.`;
}
