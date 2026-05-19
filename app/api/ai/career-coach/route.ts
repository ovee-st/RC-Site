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

function listOrFallback(items: string[], fallback: string) {
  return items.length ? items.join(", ") : fallback;
}

function fallbackReply(message: string, analysis: ReturnType<typeof analyzeCandidateProfile>) {
  const prompt = message.toLowerCase();
  const missingSkills = listOrFallback(analysis.missingSkills, "your strongest job-specific skills");
  const missingSections = listOrFallback(analysis.missingSections, "the sections recruiters scan first");

  if (prompt.includes("interview") || prompt.includes("readiness") || prompt.includes("prepare")) {
    return [
      "Interview readiness plan:",
      "1. Prepare two STAR stories: one for operations ownership and one for handling a difficult stakeholder.",
      "2. Turn your admin/coordination work into measurable outcomes, for example reporting speed, vendor turnaround, or issue resolution time.",
      "3. Practice a 45-second answer for: Tell me about yourself, Why this role, and How do you handle pressure?",
      `Priority profile gap to fix before interviews: ${missingSections}.`
    ].join("\n");
  }

  if (prompt.includes("ats") || prompt.includes("cv") || prompt.includes("resume")) {
    return [
      `ATS optimization plan for your current ${analysis.atsScore}% score:`,
      "1. Mirror the exact job title and 6-8 required keywords from the target job post.",
      "2. Keep formatting simple: clear headings, bullet points, no tables for core experience, and standard date formats.",
      "3. Rewrite bullets as action + scope + result, for example: Coordinated vendor operations across 12 sites and improved reporting follow-up.",
      `4. Add or validate these keywords if truthful: ${missingSkills}.`
    ].join("\n");
  }

  if (prompt.includes("summary") || prompt.includes("bio") || prompt.includes("about")) {
    return [
      "Use this summary structure:",
      "Line 1: Your target role + years of experience + strongest domain.",
      "Line 2: Tools, workflows, or teams you manage.",
      "Line 3: Measurable outcomes, such as faster reporting, vendor coordination, or smoother operations.",
      `Your current profile completion is ${analysis.profileCompletionScore}%, so improving the summary is a high-impact quick win.`
    ].join("\n");
  }

  if (prompt.includes("skill")) {
    return analysis.missingSkills.length
      ? [
          "Skill improvement priorities:",
          `1. Add or validate: ${missingSkills}.`,
          "2. Put your highest-match skills first, not alphabetically.",
          "3. Tie each key skill to at least one experience bullet so employers trust the claim.",
          "4. Remove generic skills that do not support your target jobs."
        ].join("\n")
      : [
          "Your core skill coverage is strong.",
          "Next improvement: group skills by category, keep the most relevant role keywords first, and connect each priority skill to a concrete achievement."
        ].join("\n");
  }

  if (prompt.includes("experience") || prompt.includes("work")) {
    return [
      "Experience rewrite framework:",
      "1. Start each bullet with a strong verb: Coordinated, Managed, Reduced, Improved, Supported.",
      "2. Add scope: number of sites, teams, vendors, reports, customers, or projects.",
      "3. Add result: saved time, reduced errors, improved follow-up, increased compliance, or smoother operations.",
      "Example: Coordinated vendor and facility operations across multiple sites, improving follow-up discipline and daily reporting visibility."
    ].join("\n");
  }

  if (prompt.includes("certification") || prompt.includes("course")) {
    return [
      "Certification recommendations:",
      "1. Excel/reporting certification for admin and operations roles.",
      "2. HR operations or compliance basics if you target HR/Admin roles.",
      "3. Project coordination or vendor management if you want operations leadership roles.",
      "Pick one certification that directly matches your next target job instead of collecting broad certificates."
    ].join("\n");
  }

  return [
    "Here is the fastest profile improvement path:",
    analysis.recommendations[0],
    analysis.recommendations[1],
    `Current scores: profile ${analysis.profileCompletionScore}%, ATS ${analysis.atsScore}%.`,
    "Ask me for ATS, interview, skills, summary, experience, or certification help and I will give a focused action plan."
  ].join("\n");
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
      const recentHistory = (body.history || [])
        .slice(-6)
        .map((item) => `${item.role}: ${item.body}`)
        .join("\n")
        .slice(0, 3000);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_CAREER_COACH_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are MX Venture Lab's AI Career Coach. Give concise, practical, candidate-specific advice for profile, CV, ATS, interviews, and job matching. Do not repeat previous answers. Use the candidate context and answer the user's exact request."
            },
            { role: "user", content: `Candidate context: ${profileContext}\n\nRecent chat:\n${recentHistory}\n\nQuestion: ${message}` }
          ],
          temperature: 0.55,
          max_tokens: 360
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

  return NextResponse.json({ reply, analysis, aiEnabled: Boolean(process.env.OPENAI_API_KEY) });
}
