import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeCandidateProfile } from "@/lib/ai/profile-analysis";

export const runtime = "nodejs";

type CoachRequest = {
  message?: string;
  profile?: Record<string, unknown>;
  analysis?: ReturnType<typeof analyzeCandidateProfile>;
  userId?: string;
  history?: Array<{ role: string; body: string }>;
};

function fallbackReply(message: string, analysis: ReturnType<typeof analyzeCandidateProfile>) {
  const prompt = message.toLowerCase();
  if (prompt.includes("summary")) return `Lead with a sharper positioning line, then add tools, scope, and measurable impact. Your profile score is ${analysis.profileCompletionScore}%, so the fastest lift is making the summary more outcome-driven.`;
  if (prompt.includes("skill")) return analysis.missingSkills.length ? `Add these missing high-signal skills where truthful: ${analysis.missingSkills.join(", ")}. Then mirror the wording used in your target jobs.` : "Your core skills are solid. Put the most relevant job-matching skills first and remove weaker filler terms.";
  if (prompt.includes("experience")) return "Rewrite experience bullets with action + scope + result. Example: Managed vendor coordination across multiple operational sites, improving reporting speed and reducing follow-up gaps.";
  if (prompt.includes("ats") || prompt.includes("cv")) return `Your ATS score is ${analysis.atsScore}%. Add exact role keywords, measurable achievements, and a skills section aligned to your target job description.`;
  if (prompt.includes("certification")) return "Choose certifications that prove your current target category: Excel/reporting, HR operations, customer support tools, project coordination, or compliance.";
  return analysis.recommendations.join(" ");
}

async function saveCoachMessage(userId: string | undefined, role: "user" | "assistant", message: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !userId) return;

  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    await client.from("career_coach_chats").insert({ user_id: userId, role, message });
  } catch {
    // Optional table: never block the coach response if storage is not deployed yet.
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as CoachRequest;
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const analysis = body.analysis || analyzeCandidateProfile(body.profile || {});
  let reply = fallbackReply(message, analysis);

  if (process.env.OPENAI_API_KEY) {
    try {
      const profileContext = JSON.stringify({ profile: body.profile, analysis }).slice(0, 6000);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CAREER_COACH_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are MX Venture Lab's AI Career Coach. Give concise, practical, candidate-specific advice for profile, CV, ATS, interviews, and job matching. Avoid generic filler." },
            { role: "user", content: `Candidate context: ${profileContext}\n\nQuestion: ${message}` }
          ],
          temperature: 0.4,
          max_tokens: 260
        })
      });
      if (response.ok) {
        const data = await response.json();
        reply = data.choices?.[0]?.message?.content?.trim() || reply;
      }
    } catch {
      // Keep deterministic fallback if the AI provider is unavailable.
    }
  }

  await Promise.all([
    saveCoachMessage(body.userId, "user", message),
    saveCoachMessage(body.userId, "assistant", reply)
  ]);

  return NextResponse.json({ reply, analysis });
}
