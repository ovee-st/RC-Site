"use client";

import AIProfileCoach from "@/components/candidate/AIProfileCoach";
import { demoCandidates } from "@/lib/demoData";

export default function AIInsights() {
  const candidate = demoCandidates[0];

  return (
    <AIProfileCoach
      userId="demo-candidate"
      plan="Basic"
      profile={{
        name: candidate.name,
        title: candidate.title,
        location: "Dhaka, Bangladesh",
        about:
          "Assistant Manager - Administration with 7+ years of experience supporting fast-growing organizations through site acquisition, vendor coordination, reporting, facility operations, and HR administration.",
        skills: candidate.skills,
        experience: [
          {
            role: "Assistant Manager",
            company: "Pathao Limited",
            period: "2022 - Present",
            description:
              "Coordinate site acquisition, vendor management, facility operations, reporting, security operations, and renovation support across multiple teams."
          }
        ],
        education: [
          {
            degree: "Bachelor of Science",
            institution: "Hajee Mohammad Danesh Science & Technology University",
            year: "2015"
          }
        ],
        certifications: [
          { name: "Administrative Human Resources", organization: "LinkedIn", year: "2020" }
        ],
        salary: { current: "BDT 10,000", expected: "BDT 100,000" },
        availability: { immediate: true, noticePeriod: "", noticeUnit: "Days" },
        profileCompletion: 88,
        resumeScore: 84
      }}
    />
  );
}
