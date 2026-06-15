import { AUTH_CHANGE_EVENT, MOCK_USER_KEY } from "@/lib/accountIdentity";

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
  return cleanValue || null;
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
