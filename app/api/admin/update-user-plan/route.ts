import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_ROLES = new Set(["admin"]);
const PLAN_VALUES = new Set(["Basic", "Pro"]);

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Admin service role is not configured on this deployment." }, { status: 500 });
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing admin session token." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Invalid admin session." }, { status: 401 });
  }

  const { data: requester, error: requesterError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (requesterError || !ADMIN_ROLES.has(String(requester?.role || ""))) {
    return NextResponse.json({ error: "Only admins can change candidate plans." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan || "Basic").trim();
  const verified = body.verified ?? plan === "Pro";
  const userId = String(body.user_id || "").trim();
  const candidateId = String(body.candidate_id || "").trim();
  const email = String(body.email || "").trim().toLowerCase();

  if (!PLAN_VALUES.has(plan)) {
    return NextResponse.json({ error: "Plan must be Basic or Pro." }, { status: 400 });
  }

  if (!userId && !candidateId && !email) {
    return NextResponse.json({ error: "Candidate identifier is required." }, { status: 400 });
  }

  if (userId) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ plan, verified })
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: { plan, verified }
    });
  } else if (email) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ plan, verified })
      .eq("email", email);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
  }

  if (candidateId) {
    await adminClient
      .from("candidates")
      .update({ plan, verified })
      .eq("id", candidateId);
  }

  if (userId) {
    await adminClient
      .from("candidates")
      .update({ plan, verified })
      .eq("user_id", userId);
  } else if (email) {
    await adminClient
      .from("candidates")
      .update({ plan, verified })
      .eq("email", email);
  }

  return NextResponse.json({ ok: true, plan, verified });
}
