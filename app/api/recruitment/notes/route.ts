import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, isUuid, requireAtsRequester, requireOwnedApplication } from "@/lib/ats/server";

const NOTE_SELECT = "id,application_id,author_id,body,plain_text,mentions,tags,current_version,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const applicationId = new URL(request.url).searchParams.get("application_id") || "";
    if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const { data, error } = await context.client.from("recruiter_notes").select(NOTE_SELECT).eq("application_id", applicationId).order("updated_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message); return NextResponse.json({ notes: data || [] });
  } catch (error) { return atsErrorResponse(error, "Could not load recruiter notes."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "notes", 60)) return atsRateResponse();
    const body = await request.json().catch(() => ({})); const plainText = cleanText(body.plain_text, 10_000);
    if (!isUuid(body.application_id) || !plainText || !await requireOwnedApplication(context, body.application_id)) return NextResponse.json({ error: "A valid application and note are required." }, { status: 400 });
    const mentions = Array.isArray(body.mentions) ? Array.from(new Set(body.mentions.filter(isUuid))).slice(0, 20) : [];
    const tags = Array.isArray(body.tags) ? Array.from(new Set(body.tags.map((item: unknown) => cleanText(item, 40)).filter(Boolean))).slice(0, 20) : [];
    const richBody = body.body && typeof body.body === "object" ? body.body : { type: "doc", content: [{ type: "paragraph", text: plainText }] };
    const result = await context.client.from("recruiter_notes").insert({ application_id: body.application_id, author_id: context.userId, body: richBody, plain_text: plainText, mentions, tags }).select(NOTE_SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await context.client.from("recruiter_note_versions").insert({ note_id: result.data.id, version: 1, body: richBody, plain_text: plainText, edited_by: context.userId });
    await appendTimeline(context, { applicationId: body.application_id, eventType: "comment_added", title: "Private recruiter note added", metadata: { note_id: result.data.id, tags, mentions } });
    return NextResponse.json({ note: result.data }, { status: 201 });
  } catch (error) { return atsErrorResponse(error, "Could not save the recruiter note."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    const body = await request.json().catch(() => ({})); const plainText = cleanText(body.plain_text, 10_000);
    if (!isUuid(body.note_id) || !plainText) return NextResponse.json({ error: "A valid note_id and note are required." }, { status: 400 });
    const existing = await context.client.from("recruiter_notes").select(NOTE_SELECT).eq("id", body.note_id).maybeSingle();
    if (!existing.data || !await requireOwnedApplication(context, existing.data.application_id)) return NextResponse.json({ error: "Recruiter note was not found." }, { status: 404 });
    const version = Number(existing.data.current_version) + 1;
    const richBody = body.body && typeof body.body === "object" ? body.body : { type: "doc", content: [{ type: "paragraph", text: plainText }] };
    const tags = Array.isArray(body.tags) ? Array.from(new Set(body.tags.map((item: unknown) => cleanText(item, 40)).filter(Boolean))).slice(0, 20) : existing.data.tags;
    const result = await context.client.from("recruiter_notes").update({ body: richBody, plain_text: plainText, tags, current_version: version, updated_at: new Date().toISOString() }).eq("id", body.note_id).select(NOTE_SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await context.client.from("recruiter_note_versions").insert({ note_id: body.note_id, version, body: richBody, plain_text: plainText, edited_by: context.userId });
    await appendTimeline(context, { applicationId: existing.data.application_id, eventType: "comment_edited", title: "Recruiter note updated", metadata: { note_id: body.note_id, version } });
    return NextResponse.json({ note: result.data });
  } catch (error) { return atsErrorResponse(error, "Could not update the recruiter note."); }
}
