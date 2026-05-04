import type { Candidate, Job } from "@/types";

export const demoJobs: Job[] = [
  {
    id: "job-1",
    title: "Admin & Operations Manager",
    company: "MX Partner Employer",
    location: "Dhaka, Bangladesh",
    category: "HR & Admin",
    experience: "Mid Level",
    jobType: "Full Time",
    workType: "On-site",
    experienceYears: "2+ years",
    deadline: "2026-05-20",
    status: "active",
    salaryMin: 30000,
    salaryMax: 50000,
    skills: ["Admin", "Excel", "Coordination", "Documentation"],
    description: "Lead daily operations, coordinate teams, maintain reporting discipline, and support HR administration across a growing company.",
    requirements: "Strong Excel skills, communication, documentation, vendor coordination, and at least 2 years of administrative experience.",
    createdAt: "2026-04-20"
  },
  {
    id: "job-2",
    title: "Customer Support Executive",
    company: "Remote Support BD",
    location: "Uttara, Dhaka",
    category: "Customer Service & Call Center",
    experience: "Entry Level",
    jobType: "Full Time",
    workType: "On-site",
    experienceYears: "0-1 year",
    deadline: "2026-05-18",
    status: "active",
    salaryMin: 18000,
    salaryMax: 28000,
    skills: ["Communication", "CRM", "Typing", "Problem Solving"],
    description: "Handle customer conversations, document issues, and coordinate resolutions with internal teams.",
    requirements: "Clear communication, typing speed, customer handling mindset, and basic CRM experience.",
    createdAt: "2026-04-22"
  },
  {
    id: "job-3",
    title: "Frontend Developer",
    company: "Venture SaaS Lab",
    location: "Remote",
    category: "IT & Telecommunication",
    experience: "Mid Level",
    jobType: "Full Time",
    workType: "Remote",
    experienceYears: "2+ years",
    deadline: "2026-05-24",
    status: "active",
    salaryMin: 70000,
    salaryMax: 120000,
    skills: ["React", "TypeScript", "CSS", "API"],
    description: "Build polished SaaS interfaces, dashboard workflows, and high-quality frontend systems.",
    requirements: "React, TypeScript, design-system thinking, API integration, and responsive UI experience.",
    createdAt: "2026-04-24"
  }
];

export const demoCandidates: Candidate[] = [
  {
    id: "candidate-1",
    name: "Md Jahid Anwar",
    title: "Administrative Human Resources",
    category: "HR & Admin",
    experience: "Mid Level",
    skills: ["Admin", "Excel", "Coordination", "Documentation"],
    profile: "Experienced admin and HR support professional with strong documentation, scheduling, and office coordination background."
  },
  {
    id: "candidate-2",
    name: "Nusrat Jahan",
    title: "Customer Support Executive",
    category: "Customer Service & Call Center",
    experience: "Entry Level",
    skills: ["Communication", "CRM", "Typing", "Problem Solving"],
    profile: "Customer service candidate with call handling, CRM logging, active listening, and issue resolution skills."
  },
  {
    id: "candidate-3",
    name: "Rahim Ahmed",
    title: "Frontend Developer",
    category: "IT & Telecommunication",
    experience: "Mid Level",
    skills: ["React", "TypeScript", "CSS", "API"],
    profile: "Frontend engineer focused on SaaS dashboards, component systems, React, TypeScript, and responsive product UI."
  }
];
