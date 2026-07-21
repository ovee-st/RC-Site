import type { OfferTemplateVariables, RediscoveryCandidateDto, TalentCrmMetrics } from "@/types/talentCrm";

const TEMPLATE_VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export function slugifyCareerPage(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function extractOfferVariables(title: string, body: string) {
  const variables = new Set<string>();
  for (const content of [title, body]) {
    for (const match of content.matchAll(TEMPLATE_VARIABLE_PATTERN)) variables.add(match[1]);
  }
  return Array.from(variables).sort();
}

export function renderOfferTemplate(template: string, values: OfferTemplateVariables) {
  return template.replace(TEMPLATE_VARIABLE_PATTERN, (_, key: string) => {
    const value = values[key];
    return value === null || value === undefined ? `{{${key}}}` : String(value);
  });
}

function tokenize(value: string) {
  return Array.from(new Set(value.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 1)));
}

export function scoreRediscoveryCandidate(input: {
  query: string;
  name: string;
  title?: string | null;
  skills?: string[];
  experience?: string | null;
  latestStage?: string | null;
  rejectionReason?: string | null;
  latestApplicationAt?: string | null;
  semanticScore?: number | null;
}): Pick<RediscoveryCandidateDto, "score" | "reasons"> {
  const queryTokens = tokenize(input.query);
  const title = `${input.name} ${input.title || ""}`.toLowerCase();
  const skills = (input.skills || []).map((skill) => skill.toLowerCase());
  const context = `${input.experience || ""} ${input.latestStage || ""} ${input.rejectionReason || ""}`.toLowerCase();
  let points = 0;
  const reasons: string[] = [];

  const matchedSkills = skills.filter((skill) => queryTokens.some((token) => skill.includes(token) || token.includes(skill)));
  if (matchedSkills.length) {
    points += Math.min(45, matchedSkills.length * 15);
    reasons.push(`Matched skills: ${matchedSkills.slice(0, 3).join(", ")}`);
  }
  const titleMatches = queryTokens.filter((token) => title.includes(token));
  if (titleMatches.length) {
    points += Math.min(25, titleMatches.length * 10);
    reasons.push("Title and profile match");
  }
  const contextMatches = queryTokens.filter((token) => context.includes(token));
  if (contextMatches.length) {
    points += Math.min(20, contextMatches.length * 6);
    reasons.push("Previous application evidence match");
  }
  if (input.latestApplicationAt) {
    const ageDays = Math.max(0, (Date.now() - new Date(input.latestApplicationAt).getTime()) / 86_400_000);
    if (ageDays <= 365) {
      points += 10;
      reasons.push("Active within the last year");
    }
  }
  if (typeof input.semanticScore === "number") {
    points = Math.max(points, Math.round(Math.max(0, Math.min(1, input.semanticScore)) * 100));
    reasons.push("Semantic profile similarity");
  }
  return { score: Math.min(100, points), reasons: reasons.length ? reasons : ["Broad profile match"] };
}

export function calculateTalentCrmMetrics(input: {
  pools: Array<{ is_archived?: boolean }>;
  members: Array<{ created_at?: string }>;
  referrals: Array<{ status?: string }>;
  events: Array<{ event_type?: string }>;
  messages: Array<{ status?: string }>;
  sources?: Array<{ source: string; hired: boolean }>;
  now?: Date;
}): TalentCrmMetrics {
  const now = input.now || new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).getTime();
  const newMembers = input.members.filter((member) => member.created_at && new Date(member.created_at).getTime() >= monthStart).length;
  const hires = input.referrals.filter((referral) => referral.status === "hired").length;
  const views = input.events.filter((event) => event.event_type === "view").length;
  const completed = input.events.filter((event) => event.event_type === "application_completed").length;
  const sourceGroups = new Map<string, { candidates: number; hires: number }>();
  for (const item of input.sources || []) {
    const current = sourceGroups.get(item.source) || { candidates: 0, hires: 0 };
    current.candidates += 1;
    if (item.hired) current.hires += 1;
    sourceGroups.set(item.source, current);
  }
  return {
    totalPoolMembers: input.members.length,
    activePools: input.pools.filter((pool) => !pool.is_archived).length,
    poolGrowth: newMembers,
    referrals: input.referrals.length,
    referralConversion: input.referrals.length ? Math.round((hires / input.referrals.length) * 100) : 0,
    careerPageViews: views,
    applicationConversion: views ? Math.round((completed / views) * 100) : 0,
    messagesSent: input.messages.filter((message) => ["sent", "delivered", "read"].includes(message.status || "")).length,
    sourceQuality: Array.from(sourceGroups, ([source, values]) => ({ ...values, source, conversion: values.candidates ? Math.round((values.hires / values.candidates) * 100) : 0 }))
  };
}
