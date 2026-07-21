import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""; if (!token) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const client = createServerSupabaseClient(); const auth = await client.auth.getUser(token); if (auth.error || !auth.data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const user = auth.data.user; const profile = await client.from("profiles").select("role").eq("id", user.id).maybeSingle(); const role = String(profile.data?.role || user.user_metadata?.role || "").toLowerCase(); if (!new Set(["candidate", "admin"]).has(role)) return NextResponse.json({ error: "Candidate access is required." }, { status: 403 });
    const applications = await client.from("applications").select("id,job_id,job_post_id,job_role,status,created_at,candidate_user_id,candidate_id").or(`candidate_user_id.eq.${user.id},candidate_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(100); if (applications.error) throw new Error(applications.error.message);
    const applicationIds = (applications.data || []).map((row) => row.id); const jobIds = Array.from(new Set((applications.data || []).flatMap((row) => [row.job_id, row.job_post_id]).filter(Boolean)));
    const [jobs, interviews, offers, messages, documents] = await Promise.all([
      jobIds.length ? client.from("jobs").select("id,job_title,company_name,job_location").in("id", jobIds) : Promise.resolve({ data: [], error: null }),
      applicationIds.length ? client.from("recruitment_interviews").select("id,application_id,interview_type,status,scheduled_at,duration_minutes,timezone,meeting_link,location").in("application_id", applicationIds).order("scheduled_at") : Promise.resolve({ data: [], error: null }),
      applicationIds.length ? client.from("recruitment_offers").select("id,application_id,status,current_version,expires_at,sent_at,viewed_at,responded_at").in("application_id", applicationIds).order("updated_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
      applicationIds.length ? client.from("talent_messages").select("id,application_id,channel,direction,message_type,subject,body,status,created_at").in("application_id", applicationIds).order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
      client.from("candidate_portal_documents").select("id,application_id,document_type,file_name,mime_type,size_bytes,created_at").eq("candidate_user_id", user.id).order("created_at", { ascending: false }).limit(100)
    ]);
    for (const result of [jobs, interviews, offers, messages, documents]) if (result.error) throw new Error(result.error.message);
    const jobMap = new Map((jobs.data || []).map((job) => [job.id, job]));
    return NextResponse.json({ applications: (applications.data || []).map((application) => ({ ...application, job: jobMap.get(application.job_id || application.job_post_id) || null })), interviews: interviews.data || [], offers: offers.data || [], messages: messages.data || [], documents: documents.data || [] });
  } catch (error) { console.error("[candidate-portal] request failed", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load candidate portal." }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || ""; if (!token) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const client = createServerSupabaseClient(); const auth = await client.auth.getUser(token); if (auth.error || !auth.data.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    const body = await request.json().catch(() => ({})); const status = body.status; if (!/^[0-9a-f-]{36}$/i.test(body.offer_id || "") || !["accepted", "declined"].includes(status)) return NextResponse.json({ error: "A valid offer and response are required." }, { status: 400 });
    const applications = await client.from("applications").select("id").or(`candidate_user_id.eq.${auth.data.user.id},candidate_id.eq.${auth.data.user.id}`).limit(500); if (applications.error) throw new Error(applications.error.message);
    const applicationIds = (applications.data || []).map((row) => row.id); if (!applicationIds.length) return NextResponse.json({ error: "Offer was not found." }, { status: 404 });
    const existing = await client.from("recruitment_offers").select("id,application_id,status").eq("id", body.offer_id).in("application_id", applicationIds).maybeSingle(); if (existing.error || !existing.data) return NextResponse.json({ error: "Offer was not found." }, { status: 404 });
    if (!["sent", "viewed"].includes(existing.data.status)) return NextResponse.json({ error: "This offer can no longer be updated." }, { status: 409 });
    const now = new Date().toISOString(); const result = await client.from("recruitment_offers").update({ status, responded_at: now, updated_at: now }).eq("id", body.offer_id).select("id,application_id,status,responded_at").single(); if (result.error) throw new Error(result.error.message);
    await client.from("application_timeline_events").insert({ application_id: existing.data.application_id, event_type: `offer_${status}`, title: `Candidate ${status} the offer`, actor_id: auth.data.user.id, actor_name: auth.data.user.user_metadata?.full_name || "Candidate", metadata: { offer_id: body.offer_id, candidate_portal: true } });
    return NextResponse.json({ offer: result.data });
  } catch (error) { console.error("[candidate-portal] update failed", error); return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update candidate portal." }, { status: 500 }); }
}
