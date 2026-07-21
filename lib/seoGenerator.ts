import { slugifyJobTitle } from "@/lib/jobSeo";

export type JobSeoInput = {
  title: string;
  company: string;
  location: string;
  category: string;
  employmentType: string;
  experience: string;
  description: string;
  requirements: string;
  skills: string[];
};

export type GeneratedJobSeo = {
  title: string;
  description: string;
  slug: string;
  keywords: string[];
  searchSummary: string;
  openGraphTitle: string;
  openGraphDescription: string;
};

export type GeneratedJobContent = {
  summary: string;
  highlights: string[];
  idealCandidate: string;
  requiredSkillsSummary: string;
  preferredSkillsSummary: string;
};

function clean(value: string) {
  return value.replace(/[#*_>`~]/g, " ").replace(/\s+/g, " ").trim();
}

function limit(value: string, maxLength: number) {
  const normalized = clean(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => clean(value)).filter(Boolean)));
}

function preferredSkillLines(requirements: string) {
  return requirements
    .split(/\r?\n|[.;]/)
    .map((line) => clean(line.replace(/^[-•]\s*/, "")))
    .filter((line) => /preferred|advantage|nice to have|plus/i.test(line));
}

export function generateJobSeo(input: JobSeoInput): GeneratedJobSeo {
  const company = input.company || "an employer";
  const location = input.location || "Flexible location";
  const title = limit(`${input.title} at ${company}`, 60);
  const lead = clean(input.description || input.requirements);
  const description = limit(
    lead || `Apply for the ${input.title} role at ${company} in ${location}. Review skills, requirements, and application details on MX Venture Lab.`,
    157
  );
  const keywords = unique([
    input.title,
    `${input.title} jobs`,
    input.category,
    input.location,
    input.employmentType,
    input.experience,
    input.company,
    ...input.skills
  ]).slice(0, 15);

  return {
    title,
    description,
    slug: slugifyJobTitle(input.title),
    keywords,
    searchSummary: limit(`${input.title} opportunity with ${company} in ${location}. ${lead}`, 220),
    openGraphTitle: limit(`${input.title} | ${company}`, 70),
    openGraphDescription: limit(description, 200)
  };
}

export function generateJobContent(input: JobSeoInput): GeneratedJobContent {
  const skills = unique(input.skills);
  const primarySkills = skills.slice(0, 5);
  const preferred = preferredSkillLines(input.requirements);
  const highlights = unique([
    `${input.employmentType || "Employment"} opportunity in ${input.location || "a flexible location"}`,
    input.experience ? `${input.experience} experience level` : "Experience requirements described in the role",
    primarySkills.length ? `Core skills: ${primarySkills.join(", ")}` : "Role-specific skills assessed during screening",
    input.category ? `Career area: ${input.category}` : "Structured employer screening",
    `Opportunity with ${input.company || "a verified employer"}`
  ]).slice(0, 5);

  return {
    summary: limit(clean(input.description) || `${input.title} opportunity at ${input.company}.`, 320),
    highlights,
    idealCandidate: limit(
      `A strong candidate brings ${input.experience || "relevant"} experience, practical ${primarySkills.join(", ") || "role-specific"} capability, and clear communication aligned with the role requirements.`,
      300
    ),
    requiredSkillsSummary: primarySkills.length
      ? `The role prioritizes ${primarySkills.join(", ")}.`
      : "Required capabilities are detailed in the employer's role requirements.",
    preferredSkillsSummary: preferred.length
      ? limit(preferred.join(" "), 260)
      : "Additional relevant tools, industry exposure, and evidence of practical results may strengthen an application."
  };
}

export function buildGeneratedJobFields(input: JobSeoInput) {
  const seo = generateJobSeo(input);
  const content = generateJobContent(input);

  return {
    seo_title_generated: seo.title,
    seo_description_generated: seo.description,
    seo_slug_generated: seo.slug,
    seo_keywords_generated: seo.keywords,
    seo_search_summary_generated: seo.searchSummary,
    seo_og_title_generated: seo.openGraphTitle,
    seo_og_description_generated: seo.openGraphDescription,
    ai_job_summary: content.summary,
    ai_job_highlights: content.highlights,
    ai_ideal_candidate_summary: content.idealCandidate,
    ai_required_skills_summary: content.requiredSkillsSummary,
    ai_preferred_skills_summary: content.preferredSkillsSummary,
    seo_generated_at: new Date().toISOString()
  };
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).map(clean).filter(Boolean).slice(0, 15) : fallback;
}

export async function generateJobEnrichment(input: JobSeoInput) {
  const fallback = buildGeneratedJobFields(input);
  if (!process.env.OPENAI_API_KEY) return fallback;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.OPENAI_SEO_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Generate accurate recruitment SEO and candidate-readable summaries. Never invent compensation, requirements, benefits, credentials, or company facts. Return JSON only."
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Create SEO metadata and supplemental summaries without replacing the original job description.",
              job: input,
              fields: ["seoTitle", "metaDescription", "searchKeywords", "searchSummary", "openGraphTitle", "openGraphDescription", "jobSummary", "highlights", "idealCandidate", "requiredSkillsSummary", "preferredSkillsSummary"]
            })
          }
        ]
      })
    });

    if (!response.ok) return fallback;
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return fallback;
    const generated = JSON.parse(content) as Record<string, unknown>;

    return {
      ...fallback,
      seo_title_generated: limit(stringValue(generated.seoTitle, fallback.seo_title_generated), 60),
      seo_description_generated: limit(stringValue(generated.metaDescription, fallback.seo_description_generated), 157),
      seo_keywords_generated: stringArray(generated.searchKeywords, fallback.seo_keywords_generated),
      seo_search_summary_generated: limit(stringValue(generated.searchSummary, fallback.seo_search_summary_generated), 220),
      seo_og_title_generated: limit(stringValue(generated.openGraphTitle, fallback.seo_og_title_generated), 70),
      seo_og_description_generated: limit(stringValue(generated.openGraphDescription, fallback.seo_og_description_generated), 200),
      ai_job_summary: limit(stringValue(generated.jobSummary, fallback.ai_job_summary), 320),
      ai_job_highlights: stringArray(generated.highlights, fallback.ai_job_highlights).slice(0, 5),
      ai_ideal_candidate_summary: limit(stringValue(generated.idealCandidate, fallback.ai_ideal_candidate_summary), 300),
      ai_required_skills_summary: limit(stringValue(generated.requiredSkillsSummary, fallback.ai_required_skills_summary), 260),
      ai_preferred_skills_summary: limit(stringValue(generated.preferredSkillsSummary, fallback.ai_preferred_skills_summary), 260)
    };
  } catch (error) {
    console.warn("[job-seo] AI enrichment unavailable; using deterministic SEO fallback.", error instanceof Error ? error.message : error);
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export function preferCustomSeo(customValue: string | null | undefined, generatedValue: string | null | undefined, fallback: string) {
  return clean(customValue || generatedValue || fallback);
}
