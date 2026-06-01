import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import {
  createProfileUsername,
  ensureRoleRecord,
  getAuthDisplayName,
  normalizePlatformRole
} from "@/lib/authUserSync";

const SUPPORT_ROLES = new Set(["support", "support_user", "support_agent", "support_senior", "support_manager", "employee"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export function createAnonSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public credentials are missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function normalizeMobileRole(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  if (ADMIN_ROLES.has(normalized)) return "admin";
  if (SUPPORT_ROLES.has(normalized)) return "support_user";
  return normalizePlatformRole(normalized) || "candidate";
}

export async function syncMobileProfile(authUser: any, preferredRole?: string | null) {
  const adminClient = createServerSupabaseClient();
  const metadata = authUser.user_metadata || {};

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  const role = normalizeMobileRole(existingProfile?.role || metadata.role || preferredRole);
  const fullName = existingProfile?.full_name || existingProfile?.name || getAuthDisplayName(authUser);
  const username =
    existingProfile?.username ||
    metadata.username ||
    createProfileUsername(role, authUser.email, fullName, authUser.id);
  const avatarUrl =
    existingProfile?.avatar_url ||
    existingProfile?.photo_url ||
    metadata.avatar_url ||
    metadata.photo_url ||
    metadata.picture ||
    null;

  const profilePayload = {
    id: authUser.id,
    email: authUser.email || existingProfile?.email || "",
    full_name: fullName,
    name: fullName,
    role,
    username,
    avatar_url: avatarUrl,
    photo_url: existingProfile?.photo_url || avatarUrl,
    plan: existingProfile?.plan || metadata.plan || (role === "admin" || role === "support_user" ? "Internal" : "Basic"),
    verified: existingProfile?.verified ?? metadata.verified ?? false,
    updated_at: new Date().toISOString()
  };

  const { data: profile, error } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  await ensureRoleRecord(adminClient, profile || profilePayload);
  return profile || profilePayload;
}

export function toMobileSession(session: any, profile: any) {
  return {
    accessToken: session?.access_token || null,
    refreshToken: session?.refresh_token || null,
    userId: profile.id,
    username: profile.username || profile.email?.split("@")[0] || profile.id,
    fullName: profile.full_name || profile.name || profile.email?.split("@")[0] || "MXVL User",
    email: profile.email,
    role: normalizeMobileRole(profile.role),
    avatarUrl: profile.avatar_url || profile.photo_url || null
  };
}
