import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { createProfileUsername, ensureRoleRecord, getAuthDisplayName } from "@/lib/authUserSync";
import { avatarAliases, fetchRoleProfileRows, resolveMobileAvatarUrl } from "./_shared/avatar";

type JsonMap = Record<string, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function createPublicAuthClient(accessToken?: string) {
  return createClient(supabaseUrl, anonKey, {
    ...(accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : {}),
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createAdminClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase service role is not configured");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function normalizeMobileRole(role: any) {
  const normalized = String(role || "candidate").toLowerCase().replace(/\s+/g, "_");
  if (["employer", "employee", "admin", "admin_viewer", "support_agent", "support_senior", "support_manager"].includes(normalized)) {
    return normalized;
  }
  return "candidate";
}

export async function buildMobileSession({
  adminClient,
  authUser,
  authSession,
  preferredRole,
}: {
  adminClient: SupabaseClient;
  authUser: User;
  authSession: Session | null;
  preferredRole?: string | null;
}) {
  const metadata = (authUser.user_metadata || {}) as JsonMap;
  const email = authUser.email || metadata.email || "";

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  const profile = (existingProfile || {}) as JsonMap;
  const fullName = profile.full_name || profile.name || getAuthDisplayName(authUser as any);
  const role = normalizeMobileRole(preferredRole || profile.role || metadata.role);
  const username = profile.username || createProfileUsername(role, email, fullName, authUser.id);
  const relatedProfileRows = await fetchRoleProfileRows(adminClient, authUser, role);
  const avatarUrl = resolveMobileAvatarUrl(adminClient, authUser, profile, ...relatedProfileRows);

  const profilePayload = {
    id: authUser.id,
    email,
    full_name: fullName,
    name: fullName,
    role,
    username,
    ...(avatarUrl ? avatarAliases(avatarUrl) : {}),
    updated_at: new Date().toISOString(),
  };

  const { data: savedProfile, error: profileError } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })
    .select("*")
    .single();

  const finalProfile = (savedProfile || { ...profile, ...profilePayload }) as JsonMap;
  if (!profileError) {
    await ensureRoleRecord(adminClient as any, finalProfile);
  }

  const finalAvatarUrl = resolveMobileAvatarUrl(adminClient, authUser, finalProfile, ...relatedProfileRows) || avatarUrl;

  return {
    user: {
      id: authUser.id,
      email,
      name: fullName,
      fullName,
      username,
      role,
      avatarUrl: finalAvatarUrl,
      ...avatarAliases(finalAvatarUrl),
      plan: finalProfile.plan || finalProfile.subscription_plan || "Basic",
      verified: Boolean(finalProfile.verified || finalProfile.is_verified),
    },
    accessToken: authSession?.access_token || null,
    refreshToken: authSession?.refresh_token || null,
  };
}
