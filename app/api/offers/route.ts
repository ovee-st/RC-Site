import { NextResponse } from "next/server";
import { appendTimeline, atsErrorResponse, atsRateResponse, cleanText, enforceAtsWriteRate, ensureDefaultPipeline, isUuid, notifyRecruiter, requireAtsRequester, requireOwnedApplication, runAutomationRules } from "@/lib/ats/server";
import { validateOfferTransition } from "@/lib/ats/workflowEngine";
import type { OfferStatus } from "@/types/ats";

const STATUSES = new Set<OfferStatus>(["draft", "internal_approval", "sent", "viewed", "accepted", "declined", "expired", "withdrawn"]);
const OFFER_SELECT = "id,employer_user_id,application_id,status,current_version,expires_at,sent_at,viewed_at,responded_at,created_by,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireAtsRequester(request, false, "offers");
    if ("response" in context) return context.response;
    const applicationId = new URL(request.url).searchParams.get("application_id") || "";
    let query = context.client.from("recruitment_offers").select(OFFER_SELECT).eq("employer_user_id", context.workspaceOwnerId).order("updated_at", { ascending: false }).limit(100);
    if (applicationId) {
      if (!isUuid(applicationId) || !await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
      query = query.eq("application_id", applicationId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (data || []).map((offer) => offer.id);
    const versions = ids.length ? await context.client.from("recruitment_offer_versions").select("id,offer_id,version,title,currency,salary,joining_date,terms,message,created_at").in("offer_id", ids).order("version", { ascending: false }) : { data: [] };
    return NextResponse.json({ offers: (data || []).map((offer) => ({ ...offer, versions: (versions.data || []).filter((version) => version.offer_id === offer.id) })) });
  } catch (error) { return atsErrorResponse(error, "Could not load offers."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "offers");
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "offers", 30)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const applicationId = body.application_id;
    const title = cleanText(body.title, 160);
    if (!isUuid(applicationId) || !title) return NextResponse.json({ error: "A valid application_id and offer title are required." }, { status: 400 });
    const salary = body.salary === null || body.salary === undefined || body.salary === "" ? null : Number(body.salary);
    if (salary !== null && (!Number.isFinite(salary) || salary < 0)) return NextResponse.json({ error: "Salary must be a non-negative number." }, { status: 400 });
    if (!await requireOwnedApplication(context, applicationId)) return NextResponse.json({ error: "Application was not found." }, { status: 404 });
    const existing = await context.client.from("recruitment_offers").select(OFFER_SELECT).eq("application_id", applicationId).maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    const version = Number(existing.data?.current_version || 0) + 1;
    let offer = existing.data;
    if (!offer) {
      const created = await context.client.from("recruitment_offers").insert({ employer_user_id: context.workspaceOwnerId, application_id: applicationId, status: "draft", current_version: 1, expires_at: body.expires_at || null, created_by: context.userId }).select(OFFER_SELECT).single();
      if (created.error) throw new Error(created.error.message);
      offer = created.data;
    } else {
      const updated = await context.client.from("recruitment_offers").update({ current_version: version, expires_at: body.expires_at || offer.expires_at, updated_at: new Date().toISOString() }).eq("id", offer.id).select(OFFER_SELECT).single();
      if (updated.error) throw new Error(updated.error.message);
      offer = updated.data;
    }
    const versionResult = await context.client.from("recruitment_offer_versions").insert({ offer_id: offer.id, version: offer.current_version, title, currency: cleanText(body.currency, 3).toUpperCase() || "BDT", salary, joining_date: body.joining_date || null, terms: body.terms && typeof body.terms === "object" ? body.terms : {}, message: cleanText(body.message, 4_000) || null, created_by: context.userId }).select("id,offer_id,version,title,currency,salary,joining_date,terms,message,created_at").single();
    if (versionResult.error) throw new Error(versionResult.error.message);
    await appendTimeline(context, { applicationId, eventType: "offer_drafted", title: `Offer version ${offer.current_version} drafted`, metadata: { offer_id: offer.id, version: offer.current_version } });
    return NextResponse.json({ offer: { ...offer, version: versionResult.data } }, { status: existing.data ? 200 : 201 });
  } catch (error) { return atsErrorResponse(error, "Could not save the offer."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireAtsRequester(request, true, "offers");
    if ("response" in context) return context.response;
    if (!enforceAtsWriteRate(context.userId, "offers", 30)) return atsRateResponse();
    const body = await request.json().catch(() => ({}));
    const status = cleanText(body.status, 30) as OfferStatus;
    if (!isUuid(body.offer_id) || !STATUSES.has(status)) return NextResponse.json({ error: "A valid offer_id and status are required." }, { status: 400 });
    const existing = await context.client.from("recruitment_offers").select(OFFER_SELECT).eq("id", body.offer_id).eq("employer_user_id", context.workspaceOwnerId).maybeSingle();
    if (existing.error || !existing.data) return NextResponse.json({ error: "Offer was not found." }, { status: 404 });
    const validation = validateOfferTransition(existing.data.status as OfferStatus, status);
    if (!validation.allowed) return NextResponse.json({ error: validation.reason }, { status: 409 });
    const now = new Date().toISOString();
    const timestamps: Record<string, string> = {};
    if (status === "sent") timestamps.sent_at = now;
    if (status === "viewed") timestamps.viewed_at = now;
    if (status === "accepted" || status === "declined") timestamps.responded_at = now;
    const result = await context.client.from("recruitment_offers").update({ status, ...timestamps, updated_at: now }).eq("id", body.offer_id).select(OFFER_SELECT).single();
    if (result.error) throw new Error(result.error.message);
    await appendTimeline(context, { applicationId: existing.data.application_id, eventType: `offer_${status}`, title: `Offer ${status.replace("_", " ")}`, description: cleanText(body.reason, 1_000) || null, metadata: { offer_id: body.offer_id, previous_status: existing.data.status, status } });
    if (status === "accepted" || status === "declined") await notifyRecruiter(context, { applicationId: existing.data.application_id, type: `offer_${status}`, title: `Offer ${status}`, message: `The candidate ${status} the offer.`, metadata: { offer_id: body.offer_id } });
    if (status === "accepted") {
      const pipeline = await ensureDefaultPipeline(context);
      await runAutomationRules(context, { pipelineId: pipeline.id, applicationId: existing.data.application_id, event: "offer_accepted", payload: { offer_id: body.offer_id } });
    }
    return NextResponse.json({ offer: result.data });
  } catch (error) { return atsErrorResponse(error, "Could not update the offer."); }
}
