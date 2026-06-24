import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

const ALLOWED_ROLES = new Set(["employer", "admin"]);
const HIRING_TYPES = new Set(["White Collar Hiring", "Blue Collar Hiring", "Bulk Hiring", "Executive Search", "Mixed Workforce"]);

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Please sign in as an employer." }, { status: 401 });

    const client = createServerSupabaseClient();
    const { data: authData, error: authError } = await client.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Invalid session." }, { status: 401 });

    const { data: profile } = await client.from("profiles").select("role").eq("id", authData.user.id).maybeSingle();
    const role = String(profile?.role || authData.user.user_metadata?.role || "").toLowerCase();
    if (!ALLOWED_ROLES.has(role)) return NextResponse.json({ error: "Only employers and admins can request managed hiring support." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const companyName = String(body.company_name || "").trim();
    const contactPerson = String(body.contact_person || "").trim();
    const email = String(body.email || authData.user.email || "").trim();
    const phone = String(body.phone || "").trim();
    const hiringType = String(body.hiring_type || "").trim();
    const positionsRequired = String(body.positions_required || "").trim();
    const hiringVolume = Math.max(1, Number(body.hiring_volume) || 0);
    const jobLocation = String(body.job_location || "").trim();
    const requirementDetails = String(body.requirement_details || "").trim();

    if (!companyName || !contactPerson || !email || !phone || !HIRING_TYPES.has(hiringType) || !positionsRequired || !hiringVolume || !jobLocation || requirementDetails.length < 20) {
      return NextResponse.json({ error: "Complete every field and provide at least 20 characters of requirement details." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const payload = {
      employer_user_id: authData.user.id,
      company_name: companyName,
      contact_person: contactPerson,
      email,
      phone,
      hiring_type: hiringType,
      positions_required: positionsRequired,
      hiring_volume: hiringVolume,
      job_location: jobLocation,
      requirement_details: requirementDetails,
      status: "new",
      updated_at: now,
      hiring_category: hiringType,
      number_of_employees: hiringVolume,
      job_roles: positionsRequired,
      roles: positionsRequired,
      quantity: String(hiringVolume),
      location: jobLocation,
      budget: "To be discussed",
      timeline: "To be discussed"
    };
    const { data, error } = await client.from("hiring_requests").insert(payload).select("*").single();
    if (error) {
      const setupMissing = /hiring_requests|employer_user_id|positions_required|requirement_details|schema cache|does not exist|Could not find/i.test(error.message || "");
      return NextResponse.json({ error: setupMissing ? `${error.message} Run supabase-hiring-consultations.sql in Supabase and reload the API schema cache.` : error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, request: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not submit hiring consultation." }, { status: 500 });
  }
}
