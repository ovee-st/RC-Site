import { NextResponse } from "next/server";
import { cleanText, crmErrorResponse, requireTalentCrmRequester } from "@/lib/crm/server";
import { slugifyCareerPage } from "@/lib/talentCrm";

const SELECT = "id,employer_user_id,slug,company_name,headline,mission,vision,values,culture,benefits,team_stories,logo_url,cover_url,video_url,seo_title,seo_description,is_published,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const result = await context.client.from("career_pages").select(SELECT).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
    if (result.error) throw new Error(result.error.message); return NextResponse.json({ careerPage: result.data });
  } catch (error) { return crmErrorResponse(error, "Could not load career page."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request, true); if ("response" in context) return context.response;
    const body = await request.json().catch(() => ({})); const companyName = cleanText(body.company_name, 120); if (!companyName) return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    const slug = slugifyCareerPage(cleanText(body.slug, 80) || companyName); if (!slug) return NextResponse.json({ error: "A valid career page slug is required." }, { status: 400 });
    const row = { employer_user_id: context.workspaceOwnerId, slug, company_name: companyName, headline: cleanText(body.headline, 180) || null, mission: cleanText(body.mission, 3_000) || null, vision: cleanText(body.vision, 3_000) || null, values: Array.isArray(body.values) ? body.values.map((value: unknown) => cleanText(value, 100)).filter(Boolean).slice(0, 20) : [], culture: cleanText(body.culture, 5_000) || null, benefits: Array.isArray(body.benefits) ? body.benefits.map((value: unknown) => cleanText(value, 160)).filter(Boolean).slice(0, 30) : [], team_stories: Array.isArray(body.team_stories) ? body.team_stories.slice(0, 20) : [], logo_url: cleanText(body.logo_url, 1_000) || null, cover_url: cleanText(body.cover_url, 1_000) || null, video_url: cleanText(body.video_url, 1_000) || null, seo_title: cleanText(body.seo_title, 70) || null, seo_description: cleanText(body.seo_description, 180) || null, is_published: Boolean(body.is_published), updated_at: new Date().toISOString() };
    const result = await context.client.from("career_pages").upsert(row, { onConflict: "employer_user_id" }).select(SELECT).single();
    if (result.error) throw new Error(result.error.message); return NextResponse.json({ careerPage: result.data });
  } catch (error) { return crmErrorResponse(error, "Could not save career page."); }
}
