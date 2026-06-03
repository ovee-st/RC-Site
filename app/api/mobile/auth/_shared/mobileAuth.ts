import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { createProfileUsername, ensureRoleRecord, getAuthDisplayName } from "@/lib/authUserSync";
import { avatarAliases, fetchRoleProfileRows, resolveMobileAvatarUrl } from "./avatar";

type JsonMap = Record<string, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export function createAnonMobileClient() {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeMobileRole(role: any) {
  const normalized = String(role || "candidate").toLowerCase().replace(/\s+/g, "_");
  if (["employer", "employee", "admin", "admin_viewer", "support_agent", "support_senior", "support_manager"].includes(normalized)) {
    return normalized;
  }
  return "candidate";
}

export async function syncMobileProfile(authUser: any, preferredRole?: string | null) {
  const adminClient = createServerSupabaseClient();
  const metadata = (authUser.user_metadata || {}) as JsonMap;
  const email = authUser.email || metadata.email || "";

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  const currentProfile = (existingProfile || {}) as JsonMap;
  const role = normalizeMobileRole(preferredRole || currentProfile.role || metadata.role);
  const fullName = currentProfile.full_name || currentProfile.name || getAuthDisplayName(authUser);
  const username = currentProfile.username || createProfileUsername(role, email, fullName, authUser.id);
  const relatedProfileRows = await fetchRoleProfileRows(adminClient, authUser, role);
  const avatarUrl = resolveMobileAvatarUrl(adminClient, authUser, currentProfile, ...relatedProfileRows);

  const profilePayload = {
    id: authUser.id,
    email,
    full_name: fullName,
    name: fullName,
    role,
    username,
    ...(avatarUrl ? avatarAliases(avatarUrl) : {}),
    plan: currentProfile.plan || currentProfile.subscription_plan || "Basic",
    updated_at: new Date().toISOString(),
  };

  const { data: savedProfile, error } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .single();

  const profile = (savedProfile || { ...currentProfile, ...profilePayload }) as JsonMap;
  if (!error) {
    await ensureRoleRecord(adminClient as any, profile);
  }

  return profile;
}

export function toMobileSession(session: any, profile: any) {
  const avatarUrl =
    profile?.avatar_url ||
    profile?.photo_url ||
    profile?.profile_photo_url ||
    profile?.profile_image_url ||
    profile?.profile_image ||
    profile?.profile_photo ||
    profile?.avatar ||
    profile?.picture ||
    profile?.image_url ||
    profile?.company_logo_url ||
    null;

  return {
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.name || profile.email || "MXVL User",
      fullName: profile.full_name || profile.name || profile.email || "MXVL User",
      username: profile.username,
      role: profile.role,
      avatarUrl,
      ...avatarAliases(avatarUrl),
      plan: profile.plan || profile.subscription_plan || "Basic",
      verified: Boolean(profile.verified || profile.is_verified),
    },
    accessToken: session?.access_token || null,
    refreshToken: session?.refresh_token || null,
  };
}
