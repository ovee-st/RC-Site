import { NextResponse } from "next/server";
import { crmErrorResponse, crmRateResponse, cleanText, enforceCrmWriteRate, isUuid, requireOwnedPool, requireTalentCrmRequester } from "@/lib/crm/server";
import { TALENT_ENGAGEMENT_STATUSES } from "@/types/talentCrm";

const POOL_SELECT = "id,employer_user_id,name,description,visibility,is_archived,created_at,updated_at";

export async function GET(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request); if ("response" in context) return context.response;
    const url = new URL(request.url); const poolId = url.searchParams.get("pool_id") || ""; const includeArchived = url.searchParams.get("archived") === "true";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") || 25)));
    const from = (page - 1) * limit;
    let query = context.client.from("talent_pools").select(POOL_SELECT, { count: "exact" }).eq("employer_user_id", context.workspaceOwnerId).order("updated_at", { ascending: false });
    if (!includeArchived) query = query.eq("is_archived", false);
    if (poolId) query = query.eq("id", poolId);
    const pools = await query.range(from, from + limit - 1); if (pools.error) throw pools.error;
    const poolIds = (pools.data || []).map((pool) => pool.id);
    const members = poolIds.length ? await context.client.from("talent_pool_members").select("id,pool_id,candidate_id,application_id,engagement_status,tags,last_contacted_at,next_follow_up_at,created_at,updated_at").in("pool_id", poolIds).order("updated_at", { ascending: false }).limit(2_500) : { data: [], error: null };
    if (members.error) throw members.error;
    const candidateIds = Array.from(new Set((members.data || []).map((member) => member.candidate_id)));
    const candidates = candidateIds.length ? await context.client.from("candidates").select("id,full_name,name,target_role,photo_url").in("id", candidateIds) : { data: [], error: null };
    if (candidates.error) throw candidates.error;
    const candidateMap = new Map((candidates.data || []).map((candidate) => [candidate.id, candidate]));
    const memberCountByPool = new Map<string, number>();
    for (const member of members.data || []) memberCountByPool.set(member.pool_id, (memberCountByPool.get(member.pool_id) || 0) + 1);
    return NextResponse.json({
      pools: (pools.data || []).map((pool) => ({ id: pool.id, name: pool.name, description: pool.description, visibility: pool.visibility, isArchived: pool.is_archived, updatedAt: pool.updated_at, memberCount: memberCountByPool.get(pool.id) || 0 })),
      members: (members.data || []).map((member) => { const candidate = candidateMap.get(member.candidate_id); return { id: member.id, poolId: member.pool_id, candidateId: member.candidate_id, candidateName: candidate?.full_name || candidate?.name || "Candidate", candidateTitle: candidate?.target_role || null, candidateAvatar: candidate?.photo_url || null, engagementStatus: member.engagement_status, tags: member.tags || [], lastContactedAt: member.last_contacted_at, nextFollowUpAt: member.next_follow_up_at }; }),
      page,
      limit,
      total: pools.count || 0
    });
  } catch (error) { return crmErrorResponse(error, "Could not load talent pools."); }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request, true); if ("response" in context) return context.response;
    if (!enforceCrmWriteRate(context.userId, "talent-pools", 60)) return crmRateResponse();
    const url = new URL(request.url);
    const memberId = url.searchParams.get("member_id");
    if (isUuid(memberId)) {
      const member = await context.client.from("talent_pool_members").select("id,pool_id").eq("id", memberId).maybeSingle();
      if (member.error) throw member.error;
      if (!member.data || !await requireOwnedPool(context, member.data.pool_id)) return NextResponse.json({ error: "Pool member was not found." }, { status: 404 });
      const removed = await context.client.from("talent_pool_members").delete().eq("id", memberId);
      if (removed.error) throw removed.error;
      return NextResponse.json({ removed: true, memberId });
    }
    const poolId = url.searchParams.get("pool_id");
    if (!isUuid(poolId) || !await requireOwnedPool(context, poolId)) return NextResponse.json({ error: "Talent pool was not found." }, { status: 404 });
    const archived = await context.client.from("talent_pools").update({ is_archived: true, updated_at: new Date().toISOString() }).eq("id", poolId).eq("employer_user_id", context.workspaceOwnerId);
    if (archived.error) throw archived.error;
    return NextResponse.json({ archived: true, poolId });
  } catch (error) { return crmErrorResponse(error, "Could not remove talent pool record."); }
}

export async function POST(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request, true); if ("response" in context) return context.response;
    if (!enforceCrmWriteRate(context.userId, "talent-pools", 60)) return crmRateResponse();
    const body = await request.json().catch(() => ({})); const action = cleanText(body.action, 30) || "create";
    if (action === "add_member") {
      if (!isUuid(body.pool_id) || !isUuid(body.candidate_id) || !await requireOwnedPool(context, body.pool_id)) return NextResponse.json({ error: "A valid pool and candidate are required." }, { status: 400 });
      const status = TALENT_ENGAGEMENT_STATUSES.includes(body.engagement_status) ? body.engagement_status : "interested";
      const result = await context.client.from("talent_pool_members").upsert({ pool_id: body.pool_id, candidate_id: body.candidate_id, application_id: isUuid(body.application_id) ? body.application_id : null, engagement_status: status, tags: Array.isArray(body.tags) ? body.tags.map((tag: unknown) => cleanText(tag, 40)).filter(Boolean).slice(0, 20) : [], notes: cleanText(body.notes, 2_000) || null, added_by: context.userId, updated_at: new Date().toISOString() }, { onConflict: "pool_id,candidate_id" }).select("id,pool_id,candidate_id,engagement_status,tags,updated_at").single();
      if (result.error) throw result.error; return NextResponse.json({ member: result.data }, { status: 201 });
    }
    const name = cleanText(body.name, 100); if (!name) return NextResponse.json({ error: "Pool name is required." }, { status: 400 });
    const result = await context.client.from("talent_pools").insert({ employer_user_id: context.workspaceOwnerId, name, description: cleanText(body.description, 1_000) || null, visibility: body.visibility === "private" ? "private" : "team", created_by: context.userId }).select(POOL_SELECT).single();
    if (result.error) throw result.error; return NextResponse.json({ pool: result.data }, { status: 201 });
  } catch (error) { return crmErrorResponse(error, "Could not save talent pool."); }
}

export async function PATCH(request: Request) {
  try {
    const context = await requireTalentCrmRequester(request, true); if ("response" in context) return context.response;
    if (!enforceCrmWriteRate(context.userId, "talent-pools", 60)) return crmRateResponse();
    const body = await request.json().catch(() => ({}));
    if (isUuid(body.member_id)) {
      const member = await context.client.from("talent_pool_members").select("id,pool_id").eq("id", body.member_id).maybeSingle();
      if (member.error || !member.data || !await requireOwnedPool(context, member.data.pool_id)) return NextResponse.json({ error: "Pool member was not found." }, { status: 404 });
      const status = TALENT_ENGAGEMENT_STATUSES.includes(body.engagement_status) ? body.engagement_status : undefined;
      const result = await context.client.from("talent_pool_members").update({ ...(status ? { engagement_status: status } : {}), next_follow_up_at: body.next_follow_up_at || null, updated_at: new Date().toISOString() }).eq("id", body.member_id).select("id,pool_id,candidate_id,engagement_status,next_follow_up_at,updated_at").single();
      if (result.error) throw result.error; return NextResponse.json({ member: result.data });
    }
    if (!isUuid(body.pool_id) || !await requireOwnedPool(context, body.pool_id)) return NextResponse.json({ error: "Talent pool was not found." }, { status: 404 });
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) { const name = cleanText(body.name, 100); if (!name) return NextResponse.json({ error: "Pool name cannot be empty." }, { status: 400 }); updates.name = name; }
    if (body.description !== undefined) updates.description = cleanText(body.description, 1_000) || null;
    if (body.visibility === "private" || body.visibility === "team") updates.visibility = body.visibility;
    if (typeof body.is_archived === "boolean") updates.is_archived = body.is_archived;
    const result = await context.client.from("talent_pools").update(updates).eq("id", body.pool_id).eq("employer_user_id", context.workspaceOwnerId).select(POOL_SELECT).single();
    if (result.error) throw result.error; return NextResponse.json({ pool: result.data });
  } catch (error) { return crmErrorResponse(error, "Could not update talent pool."); }
}
