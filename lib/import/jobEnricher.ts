import type { ExtractedJobFields, GeneratedJobFields } from "@/lib/import/types";

function clean(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function limit(value: string, length: number) {
  const normalized = clean(value);
  return normalized.length <= length ? normalized : `${normalized.slice(0, Math.max(0, length - 3)).trimEnd()}...`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

export function createDeterministicEnrichment(extracted: ExtractedJobFields): GeneratedJobFields {
  const title = extracted.title;
  const company = extracted.company;
  const location = extracted.location;
  const summarySource = extracted.responsibilities || extracted.requirements || "";
  return {
    seoTitle: title ? limit(company ? `${title} at ${company}` : title, 60) : null,
    metaDescription: title
      ? limit(`${title}${company ? ` at ${company}` : ""}${location ? ` in ${location}` : ""}. Review responsibilities, requirements, and application details.`, 157)
      : null,
    summary: summarySource ? limit(summarySource, 320) : null,
    requiredSkills: [],
    preferredSkills: [],
    suggestedCategory: null,
    suggestedLocation: null,
    suggestedIndustry: null,
    suggestedKeywords: extracted.keywords.length
      ? []
      : unique([title || "", extracted.department || "", extracted.industry || "", location || "", ...extracted.skills]).slice(0, 15),
    shortRecruiterSummary: title
      ? limit(`${title}${company ? ` for ${company}` : ""}${location ? `, based in ${location}` : ""}. ${summarySource}`, 220)
      : null
  };
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? unique(value.map(String)).slice(0, 15) : [];
}

export function mergeAiEnrichment(extracted: ExtractedJobFields, value: unknown): GeneratedJobFields {
  const fallback = createDeterministicEnrichment(extracted);
  const ai = value && typeof value === "object" ? value as Record<string, unknown> : {};

  return {
    seoTitle: stringOrNull(ai.seoTitle) || fallback.seoTitle,
    metaDescription: stringOrNull(ai.metaDescription) || fallback.metaDescription,
    summary: stringOrNull(ai.summary) || fallback.summary,
    requiredSkills: extracted.skills.length ? [] : stringArray(ai.requiredSkills),
    preferredSkills: stringArray(ai.preferredSkills),
    suggestedCategory: extracted.department ? null : stringOrNull(ai.suggestedCategory),
    suggestedLocation: extracted.location ? null : stringOrNull(ai.suggestedLocation),
    suggestedIndustry: extracted.industry ? null : stringOrNull(ai.suggestedIndustry),
    suggestedKeywords: extracted.keywords.length
      ? []
      : stringArray(ai.suggestedKeywords).length
        ? stringArray(ai.suggestedKeywords)
        : fallback.suggestedKeywords,
    shortRecruiterSummary: stringOrNull(ai.shortRecruiterSummary) || fallback.shortRecruiterSummary
  };
}
