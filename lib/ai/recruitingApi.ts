import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { RecruitingJobInput } from "@/lib/ai/recruitingTypes";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ALLOWED_ROLES = new Set(["employer", "admin"]);
const MAX_BODY_CHARS = 50_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 10 * 60 * 1_000;
const CACHE_TTL_MS = 5 * 60 * 1_000;

type RateEntry = { count: number; resetsAt: number };
type CacheEntry = { value: unknown; expiresAt: number };

const globalStore = globalThis as typeof globalThis & {
  __mxvlRecruitingRate?: Map<string, RateEntry>;
  __mxvlRecruitingCache?: Map<string, CacheEntry>;
};

const rates = globalStore.__mxvlRecruitingRate ||= new Map<string, RateEntry>();
const cache = globalStore.__mxvlRecruitingCache ||= new Map<string, CacheEntry>();

function cleanString(value: unknown, max = 8_000) {
  return String(value ?? "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => cleanString(item, 160)).filter(Boolean))).slice(0, 25);
}

export function parseRecruitingJobInput(value: unknown): RecruitingJobInput | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;
  const parsed: RecruitingJobInput = {
    title: cleanString(job.title, 180),
    company: cleanString(job.company, 180),
    location: cleanString(job.location, 240),
    salary: cleanString(job.salary, 240),
    employmentType: cleanString(job.employmentType, 100),
    experience: cleanString(job.experience, 300),
    education: cleanString(job.education, 500),
    responsibilities: cleanString(job.responsibilities),
    requirements: cleanString(job.requirements),
    skills: cleanList(job.skills),
    benefits: cleanString(job.benefits, 4_000),
    deadline: cleanString(job.deadline, 80),
    seoTitle: cleanString(job.seoTitle, 180),
    metaDescription: cleanString(job.metaDescription, 500),
    keywords: cleanList(job.keywords),
    slug: cleanString(job.slug, 240),
    summary: cleanString(job.summary, 4_000),
    category: cleanString(job.category, 180),
    industry: cleanString(job.industry, 180),
    workArrangement: cleanString(job.workArrangement, 100),
    internalLinks: job.internalLinks === true,
    structuredData: job.structuredData === true
  };
  return parsed.title ? parsed : null;
}

export async function readRecruitingRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { response: NextResponse.json({ error: "Please sign in as an employer." }, { status: 401 }) } as const;

  let client: ReturnType<typeof createServerSupabaseClient>;
  try {
    client = createServerSupabaseClient();
  } catch (error) {
    return { response: NextResponse.json({ error: "Recruiting assistance is temporarily unavailable." }, { status: 500 }) } as const;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Your session is invalid." }, { status: 401 }) } as const;
  const { data: profile, error: profileError } = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profileError) return { response: NextResponse.json({ error: "Your profile could not be verified." }, { status: 500 }) } as const;
  const role = cleanString(profile?.role || data.user.user_metadata?.role, 40).toLowerCase();
  if (!ALLOWED_ROLES.has(role)) return { response: NextResponse.json({ error: "Only employers and administrators can use recruiting assistance." }, { status: 403 }) } as const;

  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY_CHARS) return { response: NextResponse.json({ error: "The job payload is invalid or too large." }, { status: 413 }) } as const;
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { response: NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 }) } as const;
  }

  const rateKey = `${data.user.id}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const current = rates.get(rateKey);
  const next = !current || current.resetsAt <= now ? { count: 1, resetsAt: now + RATE_WINDOW_MS } : { ...current, count: current.count + 1 };
  rates.set(rateKey, next);
  if (next.count > RATE_LIMIT) return { response: NextResponse.json({ error: "Too many assistant requests. Please wait and try again." }, { status: 429 }) } as const;

  return { userId: data.user.id, body: body as Record<string, unknown> } as const;
}

export async function cachedRecruitingResult<T>(scope: string, userId: string, input: unknown, create: () => Promise<T>): Promise<{ result: T; cached: boolean }> {
  const key = createHash("sha256").update(`${scope}:${userId}:${JSON.stringify(input)}`).digest("hex");
  const stored = cache.get(key);
  if (stored && stored.expiresAt > Date.now()) return { result: stored.value as T, cached: true };
  const result = await create();
  cache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 250) {
    for (const [entryKey, entry] of cache) {
      if (entry.expiresAt <= Date.now() || cache.size > 200) cache.delete(entryKey);
    }
  }
  return { result, cached: false };
}
