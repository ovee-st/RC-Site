import mammoth from "mammoth";
import { evidenceValue, findEvidence, sanitizeResumeText } from "@/lib/ai/candidates/evidenceEngine";
import type { ParsedResume, ResumeRole } from "@/lib/ai/candidates/types";

const SKILL_DICTIONARY = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C#", "PHP", "SQL", "PostgreSQL", "MySQL", "Excel", "Power BI", "Tableau", "AWS", "Azure", "Docker", "Kubernetes", "Git", "CRM", "Payroll", "Procurement", "Recruitment", "Communication", "Leadership", "Project Management"];
const LANGUAGES = ["English", "Bangla", "Bengali", "Hindi", "Arabic", "French", "Spanish", "German", "Mandarin"];

export async function extractResumeText(buffer: Buffer, fileName: string, mimeType = "") {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "txt" || mimeType.startsWith("text/")) return buffer.toString("utf8");
  if (extension === "docx" || /wordprocessingml/.test(mimeType)) return (await mammoth.extractRawText({ buffer })).value;
  if (extension === "pdf" || mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    return (await pdfParse(buffer)).text;
  }
  throw new Error("Only PDF, DOCX, and TXT resumes are supported.");
}

function section(text: string, names: string[]) {
  const escaped = names.join("|");
  const match = text.match(new RegExp(`(?:^|\\n)(?:${escaped})\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n(?:experience|employment|education|skills|languages|projects|achievements|certifications|portfolio|references)\\s*:?\\s*\\n|$)`, "i"));
  return match?.[1]?.trim() || "";
}
function lines(value: string) { return value.split(/\r?\n|[;|]/).map((item) => item.replace(/^[-*\s]+/, "").trim()).filter((item) => item.length > 1).slice(0, 30); }

export function parseResumeText(input: string, fileName = "resume.txt"): ParsedResume {
  const rawText = sanitizeResumeText(input);
  const allLines = lines(rawText);
  const email = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = rawText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || "";
  const linkedin = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || "";
  const github = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i)?.[0] || "";
  const portfolio = rawText.match(/https?:\/\/(?![^\s]*(?:linkedin|github))[^\s)]+/i)?.[0] || "";
  const name = allLines.find((line) => !/@|https?:|\d{4,}/.test(line) && line.split(/\s+/).length <= 5) || "";
  const skills = SKILL_DICTIONARY.filter((skill) => new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(rawText));
  const languages = LANGUAGES.filter((language) => new RegExp(`\\b${language}\\b`, "i").test(rawText));
  const education = lines(section(rawText, ["education", "academic background", "qualifications"]));
  const certifications = lines(section(rawText, ["certifications", "certificates"]));
  const projects = lines(section(rawText, ["projects", "selected projects"]));
  const achievements = lines(section(rawText, ["achievements", "awards"]));
  const employmentLines = lines(section(rawText, ["experience", "employment", "work experience", "professional experience"]));
  const employmentHistory: ResumeRole[] = employmentLines.length ? [{ company: "", position: employmentLines[0], description: employmentLines.join("\n") }] : [];
  const currentPosition = employmentLines[0] || "";
  const currentCompany = employmentLines.find((line) => /\bat\b|company|ltd|limited|inc|group/i.test(line)) || "";
  const location = allLines.find((line) => /(?:Dhaka|Chattogram|Bangladesh|Remote|London|New York|Singapore|Dubai|India|Pakistan|USA|UK)/i.test(line)) || "";

  const ev = <T,>(field: string, value: T, needle = String(Array.isArray(value) ? value[0] || "" : value || "")) => evidenceValue(field, value, findEvidence(rawText, field, needle));
  return { fileName, rawText, name: ev("name", name), email: ev("email", email), phone: ev("phone", phone), location: ev("location", location), employmentHistory: ev("employmentHistory", employmentHistory, employmentLines[0]), education: ev("education", education), skills: ev("skills", skills), languages: ev("languages", languages), projects: ev("projects", projects), achievements: ev("achievements", achievements), certifications: ev("certifications", certifications), portfolio: ev("portfolio", portfolio), linkedin: ev("linkedin", linkedin), github: ev("github", github), currentCompany: ev("currentCompany", currentCompany), currentPosition: ev("currentPosition", currentPosition) };
}
