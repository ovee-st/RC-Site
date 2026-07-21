const MAX_CLEAN_TEXT_LENGTH = 60_000;

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#")) {
      const hexadecimal = code[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(code.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findJobPosting(item);
      if (match) return match;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
  if (types.some((type) => String(type).toLowerCase() === "jobposting")) return record;

  for (const nested of Object.values(record)) {
    const match = findJobPosting(nested);
    if (match) return match;
  }
  return null;
}

function jsonLdJobText(html: string) {
  const scripts = html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    try {
      const job = findJobPosting(JSON.parse(match[1].trim()));
      if (!job) continue;
      const organization = job.hiringOrganization as Record<string, unknown> | undefined;
      const location = job.jobLocation as Record<string, unknown> | undefined;
      const address = location?.address as Record<string, unknown> | undefined;
      return [
        job.title ? `Job Title: ${job.title}` : "",
        organization?.name ? `Company: ${organization.name}` : "",
        address?.addressLocality ? `Location: ${address.addressLocality}` : "",
        job.employmentType ? `Employment Type: ${job.employmentType}` : "",
        job.datePosted ? `Date Posted: ${job.datePosted}` : "",
        job.validThrough ? `Deadline: ${job.validThrough}` : "",
        job.skills ? `Skills: ${job.skills}` : "",
        job.responsibilities ? `Responsibilities: ${job.responsibilities}` : "",
        job.qualifications ? `Requirements: ${job.qualifications}` : "",
        job.description ? `Description: ${job.description}` : ""
      ].filter(Boolean).join("\n");
    } catch {
      // Ignore malformed third-party JSON-LD and continue with readable HTML.
    }
  }
  return "";
}

export function normalizeImportedText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/\r/g, "")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ +\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim()
    .slice(0, MAX_CLEAN_TEXT_LENGTH);
}

export function extractReadableContent(html: string) {
  const structured = jsonLdJobText(html);
  let body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|svg|canvas|iframe|template)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(div|section)\b[^>]*(?:id|class)=["'][^"']*(?:cookie|consent|advert|promo|newsletter|social-share|navigation|sidebar)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|main|li|h[1-6]|tr|td)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ");

  body = normalizeImportedText(body);
  return normalizeImportedText([structured, body].filter(Boolean).join("\n\n"));
}

