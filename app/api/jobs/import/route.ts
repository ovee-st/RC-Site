import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getCachedImport, setCachedImport } from "@/lib/import/cache";
import { findDuplicateJobs, DEFAULT_DUPLICATE_THRESHOLD } from "@/lib/import/duplicateChecker";
import { extractReadableContent, normalizeImportedText } from "@/lib/import/extractContent";
import { fetchJobPage, ImportFetchError, validateImportUrl } from "@/lib/import/fetchPage";
import { extractAndEnrichJob } from "@/lib/import/jobExtractor";
import type { ExistingJobForDuplicateCheck, JobImportRequest, StructuredJobImportDto } from "@/lib/import/types";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const IMPORTER_ROLES = new Set(["employer", "admin"]);
const MAX_TEXT_INPUT_LENGTH = 80_000;
const MIN_IMPORT_LENGTH = 80;

function jsonError(error: string, code: string, status: number, details?: string) {
  return NextResponse.json({ error, code, ...(details && process.env.NODE_ENV === "development" ? { details } : {}) }, { status });
}

function cacheKey(userId: string, sourceType: string, source: string) {
  return createHash("sha256").update(`${userId}:${sourceType}:${source}`).digest("hex");
}

function duplicateThreshold() {
  const configured = Number(process.env.JOB_IMPORT_DUPLICATE_THRESHOLD);
  return Number.isFinite(configured) ? Math.min(0.99, Math.max(0.5, configured)) : DEFAULT_DUPLICATE_THRESHOLD;
}

function mapExistingJobs(rows: Array<Record<string, unknown>>): ExistingJobForDuplicateCheck[] {
  return rows.map((job) => ({
    id: String(job.id),
    title: String(job.job_title || ""),
    company: String(job.company_name || ""),
    location: String(job.job_location || ""),
    description: String(job.description || ""),
    requirements: String(job.requirements || "")
  }));
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return jsonError("Please sign in as an employer before importing a job.", "UNAUTHENTICATED", 401);

  let client: ReturnType<typeof createServerSupabaseClient>;
  try {
    client = createServerSupabaseClient();
  } catch (error) {
    return jsonError("The job importer is temporarily unavailable.", "SERVER_CONFIGURATION_ERROR", 500, error instanceof Error ? error.message : String(error));
  }

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return jsonError("Your session is invalid. Please sign in again.", "UNAUTHENTICATED", 401);

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (profileError) return jsonError("Your employer profile could not be verified.", "PROFILE_LOOKUP_FAILED", 500, profileError.message);
  const role = String(profile?.role || authData.user.user_metadata?.role || "").toLowerCase();
  if (!IMPORTER_ROLES.has(role)) return jsonError("Only employers and administrators can import jobs.", "FORBIDDEN_ROLE", 403);

  const body = await request.json().catch(() => null) as JobImportRequest | null;
  if (!body || !new Set(["url", "text"]).has(body.sourceType)) {
    return jsonError("Choose URL import or paste a job description.", "INVALID_SOURCE_TYPE", 400);
  }

  let sourceText = "";
  let sourceUrl: string | null = null;
  let finalUrl: string | null = null;

  try {
    if (body.sourceType === "url") {
      sourceUrl = validateImportUrl(String(body.url || "").trim()).toString();
      const fetched = await fetchJobPage(sourceUrl);
      finalUrl = fetched.finalUrl;
      sourceText = fetched.contentType.includes("text/html") ? extractReadableContent(fetched.html) : normalizeImportedText(fetched.html);
    } else {
      const rawText = String(body.text || "").slice(0, MAX_TEXT_INPUT_LENGTH);
      sourceText = /<\/?[a-z][\s\S]*>/i.test(rawText) ? extractReadableContent(rawText) : normalizeImportedText(rawText);
    }
  } catch (error) {
    if (error instanceof ImportFetchError) return jsonError(error.message, error.code, 422);
    return jsonError("The source could not be processed. Paste the job description manually instead.", "IMPORT_SOURCE_FAILED", 422, error instanceof Error ? error.message : String(error));
  }

  if (sourceText.length < MIN_IMPORT_LENGTH) {
    return jsonError("MXVL could not find enough job content. Paste the full job description and try again.", "INSUFFICIENT_CONTENT", 422);
  }

  const key = cacheKey(authData.user.id, body.sourceType, body.sourceType === "url" ? finalUrl || sourceUrl || "" : sourceText);
  const cached = getCachedImport(key);
  if (cached) return NextResponse.json({ job: cached, cached: true });

  const pipeline = await extractAndEnrichJob(sourceText);
  const warnings = pipeline.warning ? [pipeline.warning] : [];

  let jobsQuery = client
    .from("jobs")
    .select("id, employer_id, job_title, company_name, job_location, description, requirements")
    .order("created_at", { ascending: false })
    .limit(200);
  if (role === "employer") jobsQuery = jobsQuery.eq("employer_id", authData.user.id);
  const { data: existingJobs, error: jobsError } = await jobsQuery;

  if (jobsError) {
    console.error("[job-import] duplicate lookup failed", { code: jobsError.code, message: jobsError.message });
    warnings.push("Duplicate checking is temporarily unavailable. Review your current job list before publishing.");
  }

  const dto: StructuredJobImportDto = {
    source: { type: body.sourceType, url: sourceUrl, finalUrl },
    extracted: pipeline.extracted,
    generated: pipeline.generated,
    duplicates: jobsError ? [] : findDuplicateJobs(pipeline.extracted, mapExistingJobs((existingJobs || []) as Array<Record<string, unknown>>), duplicateThreshold()),
    warnings,
    aiEnabled: pipeline.aiEnabled,
    contentPreview: sourceText.slice(0, 1_500)
  };

  setCachedImport(key, dto);
  return NextResponse.json({ job: dto, cached: false });
}

