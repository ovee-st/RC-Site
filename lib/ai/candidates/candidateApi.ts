import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { extractResumeText, parseResumeText } from "@/lib/ai/candidates/resumeParser";
import type { CandidateJob, ParsedResume } from "@/lib/ai/candidates/types";

const ROLES = new Set(["employer", "admin", "viewer"]);
const MAX_BODY = 30_000;
const windowMs = 10 * 60 * 1_000;
const globalState = globalThis as typeof globalThis & { __candidateAiRates?: Map<string, { count: number; reset: number }>; __candidateAiCache?: Map<string, { value: unknown; expires: number }> };
const rates = globalState.__candidateAiRates ||= new Map();
const cache = globalState.__candidateAiCache ||= new Map();

export async function readCandidateAiRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { response: NextResponse.json({ error: "Authentication is required." }, { status: 401 }) } as const;
  const client = createServerSupabaseClient();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "Invalid session." }, { status: 401 }) } as const;
  const { data: profile } = await client.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = String(profile?.role || data.user.user_metadata?.role || "").toLowerCase();
  if (!ROLES.has(role)) return { response: NextResponse.json({ error: "Recruiter access is required." }, { status: 403 }) } as const;
  const raw = await request.text();
  if (!raw || raw.length > MAX_BODY) return { response: NextResponse.json({ error: "Invalid request payload." }, { status: 413 }) } as const;
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw) as Record<string, unknown>; } catch { return { response: NextResponse.json({ error: "Valid JSON is required." }, { status: 400 }) } as const; }
  const key = `${data.user.id}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const current = rates.get(key);
  const next = !current || current.reset <= now ? { count: 1, reset: now + windowMs } : { ...current, count: current.count + 1 };
  rates.set(key, next);
  if (next.count > 30) return { response: NextResponse.json({ error: "Too many candidate intelligence requests." }, { status: 429 }) } as const;
  return { client, userId: data.user.id, role, body } as const;
}

export async function cachedCandidateAi<T>(scope: string, input: unknown, create: () => Promise<T>) {
  const key = createHash("sha256").update(`${scope}:${JSON.stringify(input)}`).digest("hex");
  const stored = cache.get(key);
  if (stored && stored.expires > Date.now()) return { result: stored.value as T, cached: true };
  const result = await create();
  cache.set(key, { value: result, expires: Date.now() + 10 * 60 * 1_000 });
  if (cache.size > 300) for (const [entryKey, entry] of cache) if (entry.expires <= Date.now() || cache.size > 250) cache.delete(entryKey);
  return { result, cached: false };
}

export async function loadCandidate(client: ReturnType<typeof createServerSupabaseClient>, candidateId: string) {
  const select = "id, user_id, full_name, name, email, phone_number, location, education, education_json, skills, skills_array, experience, experience_json, certifications, about, current_salary, expected_salary, career_level, target_role, resume_path, resume_url";
  const first = await client.from("candidates").select(select).eq("id", candidateId).maybeSingle();
  if (first.error) throw new Error(first.error.message);
  if (first.data) return first.data as Record<string, unknown>;
  const second = await client.from("candidates").select(select).eq("user_id", candidateId).maybeSingle();
  if (second.error) throw new Error(second.error.message);
  return second.data as Record<string, unknown> | null;
}

function structuredResume(candidate: Record<string, unknown>) {
  return [`${candidate.full_name || candidate.name || ""}`, `${candidate.email || ""}`, `${candidate.phone_number || ""}`, `${candidate.location || ""}`, "Experience", `${candidate.experience || ""}`, JSON.stringify(candidate.experience_json || []), "Education", `${candidate.education || ""}`, JSON.stringify(candidate.education_json || []), "Skills", Array.isArray(candidate.skills_array) ? candidate.skills_array.join(", ") : `${candidate.skills || ""}`, "Certifications", JSON.stringify(candidate.certifications || []), `${candidate.about || ""}`].join("\n");
}

export async function loadParsedResume(client: ReturnType<typeof createServerSupabaseClient>, candidate: Record<string, unknown>): Promise<ParsedResume> {
  const resumePath = String(candidate.resume_path || "");
  if (resumePath) {
    const cleanPath = resumePath.replace(/^.*\/candidate-documents\//, "");
    const { data, error } = await client.storage.from("candidate-documents").download(cleanPath);
    if (!error && data) {
      const buffer = Buffer.from(await data.arrayBuffer());
      const fileName = cleanPath.split("/").pop() || "resume";
      const text = await extractResumeText(buffer, fileName, data.type);
      return parseResumeText(text, fileName);
    }
  }
  return parseResumeText(structuredResume(candidate), "candidate-profile.txt");
}

export async function loadJob(client: ReturnType<typeof createServerSupabaseClient>, jobId: string): Promise<CandidateJob | null> {
  const { data, error } = await client.from("jobs").select("id, job_title, required_skills, required_skills_array, experience_level, job_level, requirements, description, category, job_location, salary_range, salary_min, salary_max, employment_type, job_type").eq("id", jobId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const required = `${data.requirements || ""}`;
  return { id: data.id, title: data.job_title || "Open Role", skills: Array.isArray(data.required_skills_array) ? data.required_skills_array : String(data.required_skills || "").split(",").map((item) => item.trim()).filter(Boolean), experience: data.experience_level || data.job_level || "", education: required.match(/(?:education|degree|bachelor|master)[^\n.]*/i)?.[0] || "", industry: data.category || "", location: data.job_location || "", salary: data.salary_range || [data.salary_min, data.salary_max].filter(Boolean).join(" - "), languages: required.match(/(?:English|Bangla|Bengali|Hindi|Arabic|French|Spanish)/gi) || [], certifications: [], employmentType: data.employment_type || data.job_type || "", description: data.description || "", requirements: required };
}

export async function bestEffortInsert(client: ReturnType<typeof createServerSupabaseClient>, table: string, row: Record<string, unknown>) {
  const { error } = await client.from(table).insert(row);
  if (error && !/does not exist|schema cache/i.test(error.message)) console.error("[candidate-ai] persistence failed", { table, code: error.code, message: error.message });
}

export function candidateAiErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Candidate intelligence could not be generated.";
  console.error("[candidate-ai] request failed", { message: message.slice(0, 240) });
  return NextResponse.json({ error: message }, { status: /not found/i.test(message) ? 404 : 500 });
}
