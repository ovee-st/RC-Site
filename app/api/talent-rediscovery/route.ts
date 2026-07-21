import { NextResponse } from "next/server";
import { cleanText, crmErrorResponse, requireTalentCrmRequester } from "@/lib/crm/server";
import { scoreRediscoveryCandidate } from "@/lib/talentCrm";

function skills(value: unknown, fallback: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(fallback || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const url = new URL(request.url); const query = cleanText(url.searchParams.get("q"), 180); const limit = Math.max(1, Math.min(50, Number(url.searchParams.get("limit") || 25)));
    if (query.length < 2) return NextResponse.json({ results: [], query, semantic: false });
    let applicationsQuery = context.client.from("applications").select("id,candidate_id,candidate_user_id,status,created_at,job_role,employer_id,employer_user_id").order("created_at", { ascending: false }).limit(500);
    if (context.role !== "admin") { const filters = [`employer_user_id.eq.${context.workspaceOwnerId}`]; if (context.employerId) filters.push(`employer_id.eq.${context.employerId}`); applicationsQuery = applicationsQuery.or(filters.join(",")); }
    const applications = await applicationsQuery; if (applications.error) throw new Error(applications.error.message);
    const candidateIds = Array.from(new Set((applications.data || []).flatMap((row) => [row.candidate_id, row.candidate_user_id]).filter(Boolean)));
    const candidates = candidateIds.length ? await context.client.from("candidates").select("id,user_id,full_name,name,title,target_role,skills,skills_array,experience,about").or(`id.in.(${candidateIds.join(",")}),user_id.in.(${candidateIds.join(",")})`).limit(500) : { data: [], error: null };
    if (candidates.error) throw new Error(candidates.error.message);
    const latestByCandidate = new Map<string, (typeof applications.data)[number]>();
    for (const row of applications.data || []) for (const id of [row.candidate_id, row.candidate_user_id]) if (id && !latestByCandidate.has(id)) latestByCandidate.set(id, row);
    const results = (candidates.data || []).map((candidate) => {
      const application = latestByCandidate.get(candidate.id) || latestByCandidate.get(candidate.user_id);
      const candidateSkills = skills(candidate.skills_array, candidate.skills);
      const ranked = scoreRediscoveryCandidate({ query, name: candidate.full_name || candidate.name || "Candidate", title: candidate.title || candidate.target_role, skills: candidateSkills, experience: `${candidate.experience || ""} ${candidate.about || ""}`, latestStage: application?.status, rejectionReason: application?.status?.toLowerCase().includes("reject") ? application.status : null, latestApplicationAt: application?.created_at });
      return { candidateId: candidate.id, applicationId: application?.id || null, name: candidate.full_name || candidate.name || "Candidate", title: candidate.title || candidate.target_role || null, skills: candidateSkills, experience: candidate.experience || null, latestStage: application?.status || null, latestApplicationAt: application?.created_at || null, rejectionReason: application?.status?.toLowerCase().includes("reject") ? application.status : null, ...ranked };
    }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    return NextResponse.json({ results, query, semantic: false, note: "Deterministic evidence ranking is active. A semantic score can be supplied when an embedding provider is configured." });
  } catch (error) { return crmErrorResponse(error, "Could not rediscover talent."); }
}
