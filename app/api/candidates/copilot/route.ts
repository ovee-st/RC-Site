import { NextResponse } from "next/server";
import { cachedCandidateAi, candidateAiErrorResponse, readCandidateAiRequest } from "@/lib/ai/candidates/candidateApi";
import { searchCandidates } from "@/lib/ai/candidates/copilot";

export async function POST(request: Request) {
  const context = await readCandidateAiRequest(request); if ("response" in context) return context.response;
  const query = String(context.body.query || "").slice(0, 300); if (query.length < 2) return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  try {
  const output = await cachedCandidateAi("copilot", query, async () => { const { data, error } = await context.client.from("candidates").select("id, user_id, full_name, name, target_role, career_level, skills, skills_array, about, experience, location").limit(200); if (error) throw new Error(error.message); return searchCandidates(query, (data || []).map((row) => ({ id: row.user_id || row.id, name: row.full_name || row.name || "Candidate", title: row.target_role || row.career_level || "Candidate", skills: Array.isArray(row.skills_array) ? row.skills_array : String(row.skills || "").split(",").map((item) => item.trim()).filter(Boolean), profile: `${row.about || ""} ${row.experience || ""}`, location: row.location || "" }))); });
  return NextResponse.json(output);
  } catch (error) { return candidateAiErrorResponse(error); }
}
