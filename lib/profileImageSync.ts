import { AUTH_CHANGE_EVENT, MOCK_USER_KEY } from "@/lib/accountIdentity";
import { supabase } from "@/lib/supabaseClient";

type ProfileRole = "candidate" | "employer" | "admin" | "viewer" | "employee" | "support_agent" | "support_senior" | "support_manager";

type SyncProfileImageOptions = {
  role: ProfileRole;
  name?: string | null;
  avatarUrl?: string | null;
  profileStorageKey?: string;
  profilePatch?: Record<string, unknown>;
};

export function normalizeProfileImageUrl(value?: string | null) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return null;
  if (/^(https?:|data:image\/|blob:)/i.test(cleanValue) || cleanValue.startsWith("/")) return cleanValue;

  const storagePath = cleanValue.replace(/^\.?\//, "").replace(/^storage\/v1\/object\/public\//, "");
  if (/^(profile-photos|profile_photos|profile-images|profile_images|avatars|candidates|employers|logos|uploads)\//i.test(storagePath)) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
    return baseUrl ? `${baseUrl}/storage/v1/object/public/${storagePath}` : cleanValue;
  }

  return cleanValue;
}

export async function uploadProfileMedia(file: File, userId: string, kind: "avatar" | "banner" = "avatar") {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Profile images must be 8 MB or smaller.");
  if (!userId) throw new Error("Please sign in before uploading an image.");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${kind}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("profile-photos").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Could not create a public image URL.");
  return data.publicUrl;
}

export function avatarAliases(avatarUrl?: string | null) {
  const value = normalizeProfileImageUrl(avatarUrl);
  return {
    avatar: value,
    avatar_url: value,
    photo_url: value,
    profile_photo_url: value,
    logo_url: value,
    company_logo_url: value,
    company_photo_url: value
  };
}

const avatarAliasKeys = [
  "avatar",
  "avatar_url",
  "photo_url",
  "profile_photo_url",
  "profile_image_url",
  "profile_image",
  "profile_photo",
  "picture",
  "image",
  "image_url",
  "logo_url",
  "company_logo_url",
  "company_photo_url",
  "company_avatar_url",
  "company_profile_photo_url",
  "company_profile_image_url"
] as const;

export function isInlineProfileImage(value?: string | null) {
  const cleanValue = normalizeProfileImageUrl(value);
  return Boolean(cleanValue && (/^data:image\//i.test(cleanValue) || cleanValue.length > 2048));
}

export function authSafeAvatarAliases(avatarUrl?: string | null) {
  return avatarAliases(isInlineProfileImage(avatarUrl) ? null : avatarUrl);
}

export function stripInlineAuthAvatarMetadata(metadata?: Record<string, unknown> | null) {
  const next = { ...(metadata || {}) };
  avatarAliasKeys.forEach((key) => {
    if (isInlineProfileImage(next[key] as string | null | undefined)) {
      next[key] = null;
    }
  });
  return next;
}

export function syncProfileImageState({ role, name, avatarUrl, profileStorageKey, profilePatch = {} }: SyncProfileImageOptions) {
  if (typeof window === "undefined") return;

  const cleanAvatar = normalizeProfileImageUrl(avatarUrl);
  const cleanName = String(name || "").trim();

  try {
    if (profileStorageKey) {
      const storedProfile = window.localStorage.getItem(profileStorageKey);
      const parsedProfile = storedProfile ? JSON.parse(storedProfile) : {};
      window.localStorage.setItem(profileStorageKey, JSON.stringify({
        ...parsedProfile,
        ...profilePatch,
        ...avatarAliases(cleanAvatar)
      }));
    }
  } catch {
    // Profile storage sync is best-effort.
  }

  try {
    const storedMock = window.localStorage.getItem(MOCK_USER_KEY);
    const currentMock = storedMock ? JSON.parse(storedMock) : {};
    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      ...currentMock,
      ...(cleanName ? { name: cleanName } : {}),
      role,
      ...avatarAliases(cleanAvatar),
      user_metadata: {
        ...currentMock.user_metadata,
        ...(cleanName ? { name: cleanName, full_name: cleanName } : {}),
        role,
        ...avatarAliases(cleanAvatar)
      }
    }));
  } catch {
    // Local auth sync is best-effort.
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}
