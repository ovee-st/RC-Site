import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  createProfileUsername,
  ensureRoleRecord,
  getAuthDisplayName,
} from "@/lib/authUserSync";

type JsonMap = Record<string, any>;

export function createPublicAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public auth credentials are missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function normalizeMobileRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (["admin", "super_admin"].includes(role)) return "admin";
  if (["viewer", "admin_viewer", "admin-viewer", "admin (viewer)"].includes(role)) {
    return "admin";
  }
  if (["support", "support_user", "support_agent", "support_senior", "support_manager"].includes(role)) {
    return role;
  }
  if (role === "employee") return "support_user";
  if (["candidate", "employer", "recruiter"].includes(role)) return role;

  return "candidate";
}

export async function buildMobileSession(
  adminClient: SupabaseClient,
  authUser: User,
  session: Session | null,
  requestedRole?: string | null,
) {
  const metadata = (authUser.user_metadata || {}) as JsonMap;
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  const profile = (existingProfile || {}) as JsonMap;
  const fullName =
    profile.full_name ||
    profile.name ||
    getAuthDisplayName(authUser) ||
    metadata.full_name ||
    metadata.name ||
    authUser.email?.split("@")[0] ||
    "MXVL User";
  const role = normalizeMobileRole(profile.role || metadata.role || requestedRole);
  const username =
    profile.username ||
    metadata.username ||
    createProfileUsername(role, authUser.email || profile.email, fullName, authUser.id);
  const avatarUrl =
    profile.avatar_url ||
    profile.photo_url ||
    profile.profile_image_url ||
    metadata.avatar_url ||
    metadata.picture ||
    null;

  const profilePayload = {
    id: authUser.id,
    email: authUser.email || profile.email || null,
    full_name: fullName,
    name: fullName,
    role,
    username,
    avatar_url: avatarUrl,
    photo_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const { data: savedProfile, error: profileError } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  const finalProfile = (savedProfile || { ...profile, ...profilePayload }) as JsonMap;

  if (!profileError) {
    await ensureRoleRecord(adminClient, finalProfile);
  }

  return {
    accessToken: session?.access_token || null,
    refreshToken: session?.refresh_token || null,
    userId: authUser.id,
    username: finalProfile.username || username,
    fullName: finalProfile.full_name || finalProfile.name || fullName,
    email: authUser.email || finalProfile.email || null,
    role: normalizeMobileRole(finalProfile.role || role),
    avatarUrl:
      finalProfile.avatar_url ||
      finalProfile.photo_url ||
      finalProfile.profile_image_url ||
      avatarUrl ||
      null,
  };
}
