import { NextResponse } from "next/server";
import { atsErrorResponse, cleanText, requireAtsRequester } from "@/lib/ats/server";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request); if ("response" in context) return context.response;
    const query = cleanText(new URL(request.url).searchParams.get("q"), 100);
    if (query.length < 2) return NextResponse.json({ results: [] });
    const pattern = `%${query.replace(/[%_,()]/g, " ")}%`;
    const [candidates, jobs, tasks, offers, interviews, timeline] = await Promise.all([
      context.client.from("candidates").select("id,user_id,full_name,name,title").or(`full_name.ilike.${pattern},name.ilike.${pattern},title.ilike.${pattern}`).limit(10),
      context.client.from("jobs").select("id,job_title,company_name").eq("employer_id", context.workspaceOwnerId).or(`job_title.ilike.${pattern},company_name.ilike.${pattern}`).limit(10),
      context.client.from("recruitment_tasks").select("id,application_id,title,status,due_at").eq("employer_user_id", context.workspaceOwnerId).ilike("title", pattern).limit(10),
      context.client.from("recruitment_offers").select("id,application_id,status,updated_at").eq("employer_user_id", context.workspaceOwnerId).limit(10),
      context.client.from("recruitment_interviews").select("id,application_id,interview_type,status,scheduled_at").eq("employer_user_id", context.workspaceOwnerId).limit(10),
      context.client.from("application_timeline_events").select("id,application_id,title,event_type,created_at").ilike("title", pattern).limit(10)
    ]);
    return NextResponse.json({ results: [
      ...(candidates.data || []).map((item) => ({ type: "candidate", id: item.id, title: item.full_name || item.name, subtitle: item.title })),
      ...(jobs.data || []).map((item) => ({ type: "job", id: item.id, title: item.job_title, subtitle: item.company_name })),
      ...(tasks.data || []).map((item) => ({ type: "task", id: item.id, title: item.title, subtitle: item.status, applicationId: item.application_id })),
      ...(offers.data || []).map((item) => ({ type: "offer", id: item.id, title: `Offer ${item.status}`, subtitle: item.updated_at, applicationId: item.application_id })),
      ...(interviews.data || []).map((item) => ({ type: "interview", id: item.id, title: `${item.interview_type} interview`, subtitle: item.scheduled_at, applicationId: item.application_id })),
      ...(timeline.data || []).map((item) => ({ type: "timeline", id: item.id, title: item.title, subtitle: item.event_type, applicationId: item.application_id }))
    ] });
  } catch (error) { return atsErrorResponse(error, "Could not search the recruitment workspace."); }
}
