import { NextResponse } from "next/server";
import { atsErrorResponse, isUuid, requireAtsRequester } from "@/lib/ats/server";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const { data, error, count } = await context.client.from("recruitment_notifications").select("id,application_id,notification_type,title,message,metadata,read_at,created_at", { count: "exact" }).eq("user_id", context.userId).order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message); return NextResponse.json({ notifications: data || [], unreadCount: (data || []).filter((item) => !item.read_at).length, total: count || 0 });
  } catch (error) { return atsErrorResponse(error, "Could not load recruitment notifications."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true); if ("response" in context) return context.response;
    const body = await request.json().catch(() => ({})); if (!isUuid(body.notification_id)) return NextResponse.json({ error: "A valid notification_id is required." }, { status: 400 });
    const result = await context.client.from("recruitment_notifications").update({ read_at: new Date().toISOString() }).eq("id", body.notification_id).eq("user_id", context.userId).select("id,read_at").maybeSingle(); if (result.error) throw new Error(result.error.message); return NextResponse.json({ notification: result.data });
  } catch (error) { return atsErrorResponse(error, "Could not update notification."); }
}
