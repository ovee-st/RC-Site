import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { normalizeJobPatch, normalizeJobStatus } from "@/lib/jobUpdate";

const ADMIN_ROLES = new Set(["admin"]);

function missingColumnFromError(message?: string) {
  if (!message) return null;
  return (
    message.match(/Could not find the '([^']+)' column/i)?.[1] ||
    message.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    null
  );
}

async function updateJobWithFallback(adminClient: ReturnType<typeof createServerSupabaseClient>, jobId: string, patch: Record<string, any>) {
  let currentPatch = patch;
  let triedLegacyArchivedStatus = false;
  let lastError: any = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { data, error } = await adminClient
      .from("jobs")
      .update(currentPatch)
      .eq("id", jobId)
      .select("*")
      .maybeSingle();

    if (!error) return { data, storedPatch: currentPatch, error: null };
    lastError = error;

    const missingColumn = missingColumnFromError(error.message);
    if (missingColumn && missingColumn in currentPatch) {
      const { [missingColumn]: _removed, ...compatiblePatch } = currentPatch;
      currentPatch = compatiblePatch;
      continue;
    }

    if (currentPatch.status === "archived" && !triedLegacyArchivedStatus) {
      currentPatch = { ...currentPatch, status: "inactive" };
      triedLegacyArchivedStatus = true;
      continue;
    }

    break;
  }

  return { data: null, storedPatch: null, error: lastError };
}

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const adminClient = createServerSupabaseClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  const { data: existingJob, error: jobError } = await adminClient
    .from("jobs")
    .select("id, employer_id")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !existingJob) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const role = String(profile?.role || "");
  const ownsJob = existingJob.employer_id === authData.user.id;

  if (!ADMIN_ROLES.has(role) && !ownsJob) {
    return NextResponse.json({ error: "You do not have permission to update this job." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const patch = normalizeJobPatch(body);

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "No job updates were provided." }, { status: 400 });
  }

  const result = await updateJobWithFallback(adminClient, jobId, patch);

  if (result.error) {
    return NextResponse.json({ error: result.error.message || "Could not update job." }, { status: 400 });
  }

  return NextResponse.json({
    job: result.data ? { ...result.data, status: normalizeJobStatus(result.data.status) } : null,
    status: normalizeJobStatus(result.data?.status || patch.status),
    saved: true
  });
}
