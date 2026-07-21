import { NextResponse } from "next/server";
import { atsErrorResponse, isUuid, requireAtsRequester, requireOwnedApplication } from "@/lib/ats/server";
import type { TimelineEventDto } from "@/types/ats";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request);
    if ("response" in context) return context.response;
    const url = new URL(request.url);
    const applicationId = url.searchParams.get("application_id") || "";
    const limit = Math.max(10, Math.min(100, Number(url.searchParams.get("limit") || 30)));
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    if (!isUuid(applicationId)) return NextResponse.json({ error: "A valid application_id is required." }, { status: 400 });
    if (!await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const from = (page - 1) * limit;
    const { data, error, count } = await context.client.from("application_timeline_events").select("id,application_id,event_type,title,description,actor_id,actor_name,metadata,created_at", { count: "exact" }).eq("application_id", applicationId).order("created_at", { ascending: false }).range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    const events: TimelineEventDto[] = (data || []).map((row) => ({ id: row.id, applicationId: row.application_id, eventType: row.event_type, title: row.title, description: row.description, actorId: row.actor_id, actorName: row.actor_name, metadata: row.metadata || {}, createdAt: row.created_at }));
    return NextResponse.json({ events, hasMore: page * limit < (count || 0), nextPage: page * limit < (count || 0) ? page + 1 : null });
  } catch (error) { return atsErrorResponse(error, "Could not load the application timeline."); }
}
