import { createDeterministicEnrichment, mergeAiEnrichment } from "@/lib/import/jobEnricher";
import type { ExtractedJobFields, GeneratedJobFields } from "@/lib/import/types";

const AI_TIMEOUT_MS = 12_000;
const MAX_AI_INPUT_LENGTH = 45_000;

function clean(value: string | null | undefined) {
  const normalized = String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return normalized || null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => clean(String(item))).filter((item): item is string => Boolean(item)))).slice(0, 25);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function dateOrNull(value: unknown) {
  const normalized = clean(typeof value === "string" ? value : null);
  if (!normalized) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : null;
}

function labelledValue(text: string, labels: string[]) {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*[:\\-]\\s*([^\\n]+)`, "i"));
    if (match?.[1]) return clean(match[1]);
  }
  return null;
}

function sectionValue(text: string, labels: string[], nextLabels: string[]) {
  const start = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const next = nextLabels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${start})\\s*:?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:${next})\\s*:?|$)`, "i"));
  return clean(match?.[1]);
}

function splitList(value: string | null) {
  if (!value) return [];
  return Array.from(new Set(value.split(/,|\||;|\n|\u2022|\s+-\s+/).map((item) => clean(item)).filter((item): item is string => Boolean(item)))).slice(0, 25);
}

function salaryValues(salaryText: string | null) {
  if (!salaryText) return { minimum: null, maximum: null };
  const values = [...salaryText.matchAll(/\d[\d,.]*/g)]
    .map((match) => Number(match[0].replace(/[,]/g, "")))
    .filter((value) => Number.isFinite(value));
  return { minimum: values[0] ?? null, maximum: values[1] ?? values[0] ?? null };
}

export function extractJobFieldsDeterministically(text: string): ExtractedJobFields {
  const responsibilities = sectionValue(text, ["Responsibilities", "Key Responsibilities", "Duties", "Role Overview"], ["Requirements", "Qualifications", "Skills", "Benefits", "Compensation", "How to Apply"]);
  const requirements = sectionValue(text, ["Requirements", "Qualifications", "Candidate Requirements"], ["Benefits", "Compensation", "Skills", "How to Apply", "Application Method"]);
  const benefits = sectionValue(text, ["Benefits", "What We Offer", "Compensation and Benefits"], ["How to Apply", "Application Method", "Deadline"]);
  const skillsText = labelledValue(text, ["Skills", "Required Skills", "Key Skills"]);
  const keywordsText = labelledValue(text, ["Keywords", "Job Keywords"]);
  const salaryText = labelledValue(text, ["Salary", "Compensation", "Salary Range"]);
  const salary = salaryValues(salaryText);
  const firstLine = text.split("\n").map(clean).find((line) => line && line.length <= 120) || null;

  return {
    title: labelledValue(text, ["Job Title", "Position", "Role", "Designation"]) || firstLine,
    company: labelledValue(text, ["Company", "Hiring Organization", "Organization"]),
    location: labelledValue(text, ["Location", "Job Location", "Work Location"]),
    employmentType: labelledValue(text, ["Employment Type", "Job Type", "Employment Status"]),
    salaryMin: salary.minimum,
    salaryMax: salary.maximum,
    salaryText,
    experience: labelledValue(text, ["Experience", "Experience Required", "Years of Experience"]),
    education: labelledValue(text, ["Education", "Educational Requirements", "Qualification"]),
    vacancies: numberOrNull(labelledValue(text, ["Vacancies", "Vacancy", "Positions", "Number of Positions"])),
    deadline: dateOrNull(labelledValue(text, ["Deadline", "Application Deadline", "Valid Through", "Last Date"])),
    responsibilities,
    requirements,
    benefits,
    skills: splitList(skillsText),
    industry: labelledValue(text, ["Industry", "Business Area"]),
    department: labelledValue(text, ["Department", "Job Category", "Category"]),
    jobLevel: labelledValue(text, ["Job Level", "Seniority", "Career Level"]),
    workArrangement: labelledValue(text, ["Work Arrangement", "Work Type", "Workplace", "Remote Status"]),
    applicationMethod: sectionValue(text, ["How to Apply", "Application Method"], ["Deadline", "Application Deadline"]) || labelledValue(text, ["How to Apply", "Application Method"]),
    keywords: splitList(keywordsText)
  };
}

function normalizeAiExtraction(value: unknown, fallback: ExtractedJobFields): ExtractedJobFields {
  const ai = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const prefer = (key: string, fallbackValue: string | null) => clean(typeof ai[key] === "string" ? String(ai[key]) : null) || fallbackValue;
  return {
    title: prefer("title", fallback.title),
    company: prefer("company", fallback.company),
    location: prefer("location", fallback.location),
    employmentType: prefer("employmentType", fallback.employmentType),
    salaryMin: numberOrNull(ai.salaryMin) ?? fallback.salaryMin,
    salaryMax: numberOrNull(ai.salaryMax) ?? fallback.salaryMax,
    salaryText: prefer("salaryText", fallback.salaryText),
    experience: prefer("experience", fallback.experience),
    education: prefer("education", fallback.education),
    vacancies: numberOrNull(ai.vacancies) ?? fallback.vacancies,
    deadline: dateOrNull(ai.deadline) || fallback.deadline,
    responsibilities: prefer("responsibilities", fallback.responsibilities),
    requirements: prefer("requirements", fallback.requirements),
    benefits: prefer("benefits", fallback.benefits),
    skills: stringArray(ai.skills).length ? stringArray(ai.skills) : fallback.skills,
    industry: prefer("industry", fallback.industry),
    department: prefer("department", fallback.department),
    jobLevel: prefer("jobLevel", fallback.jobLevel),
    workArrangement: prefer("workArrangement", fallback.workArrangement),
    applicationMethod: prefer("applicationMethod", fallback.applicationMethod),
    keywords: stringArray(ai.keywords).length ? stringArray(ai.keywords) : fallback.keywords
  };
}

async function requestAiExtraction(text: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_JOB_IMPORT_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Extract job facts and create conservative recruiting summaries. Never invent facts. Unknown extracted values must be null. Return JSON only with extracted and generated objects. Generated category, location, industry, skills, and keywords must only be supplied when the corresponding extracted information is missing."
          },
          {
            role: "user",
            content: JSON.stringify({
              extractedFields: ["title", "company", "location", "employmentType", "salaryMin", "salaryMax", "salaryText", "experience", "education", "vacancies", "deadline", "responsibilities", "requirements", "benefits", "skills", "industry", "department", "jobLevel", "workArrangement", "applicationMethod", "keywords"],
              generatedFields: ["seoTitle", "metaDescription", "summary", "requiredSkills", "preferredSkills", "suggestedCategory", "suggestedLocation", "suggestedIndustry", "suggestedKeywords", "shortRecruiterSummary"],
              jobContent: text.slice(0, MAX_AI_INPUT_LENGTH)
            })
          }
        ]
      })
    });

    if (!response.ok) throw new Error(`OpenAI returned HTTP ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty response");
    return JSON.parse(content) as { extracted?: unknown; generated?: unknown };
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractAndEnrichJob(text: string): Promise<{
  extracted: ExtractedJobFields;
  generated: GeneratedJobFields;
  aiEnabled: boolean;
  warning: string | null;
}> {
  const fallback = extractJobFieldsDeterministically(text);
  if (!process.env.OPENAI_API_KEY) {
    return {
      extracted: fallback,
      generated: createDeterministicEnrichment(fallback),
      aiEnabled: false,
      warning: "AI extraction is unavailable, so MXVL used its structured fallback. Review all fields before publishing."
    };
  }

  try {
    const ai = await requestAiExtraction(text);
    const extracted = normalizeAiExtraction(ai?.extracted, fallback);
    return {
      extracted,
      generated: mergeAiEnrichment(extracted, ai?.generated),
      aiEnabled: true,
      warning: null
    };
  } catch (error) {
    console.error("[job-import] AI extraction failed", error instanceof Error ? error.message : error);
    return {
      extracted: fallback,
      generated: createDeterministicEnrichment(fallback),
      aiEnabled: false,
      warning: "AI extraction could not be completed. MXVL used its structured fallback; review all fields before publishing."
    };
  }
}
