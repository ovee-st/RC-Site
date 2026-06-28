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

  const storagePath = cleanValue
    .replace(/^\.?\//, "")
    .replace(/^storage\/v1\/object\/(?:public|sign)\//, "");
const bareProfileObject = /^[0-9a-f]{8}-[0-9a-f-]{27,}\/(?:avatar-|banner-)?[^/]+\.(?:png|jpe?g|webp|gif|avif|svg)(?:\?.*)?$/i.test(storagePath);
  const qualifiedStoragePath = bareProfileObject ? `profile-photos/${storagePath}` : storagePath;
  if (/^(profile-photos|profile_photos|profile-images|profile_images|avatars|candidates|employers|logos|uploads)\//i.test(qualifiedStoragePath)) {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
    return baseUrl ? `${baseUrl}/storage/v1/object/public/${qualifiedStoragePath}` : cleanValue;
  }

  return cleanValue;
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the selected image."));
    };
    image.src = objectUrl;
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality = 0.8) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Could not optimize the selected image."));
    }, "image/webp", quality);
  });
}

async function optimizeProfileImage(file: File) {
  const image = await loadImageElement(file);
  const fullScale = image.naturalWidth > 1200 ? 1200 / image.naturalWidth : 1;
  const fullWidth = Math.max(1, Math.round(image.naturalWidth * fullScale));
  const fullHeight = Math.max(1, Math.round(image.naturalHeight * fullScale));
  const fullCanvas = document.createElement("canvas");
  fullCanvas.width = fullWidth;
  fullCanvas.height = fullHeight;
  const fullContext = fullCanvas.getContext("2d");
  if (!fullContext) throw new Error("Could not optimize the selected image.");
  fullContext.drawImage(image, 0, 0, fullWidth, fullHeight);

  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = 150;
  thumbnailCanvas.height = 150;
  const thumbnailContext = thumbnailCanvas.getContext("2d");
  if (!thumbnailContext) throw new Error("Could not create the image thumbnail.");
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, Math.round((image.naturalWidth - sourceSize) / 2));
  const sourceY = Math.max(0, Math.round((image.naturalHeight - sourceSize) / 2));
  thumbnailContext.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 150, 150);

  return {
    full: await canvasToWebp(fullCanvas, 0.8),
    thumbnail: await canvasToWebp(thumbnailCanvas, 0.8)
  };
}

export function getProfileThumbnailUrl(value?: string | null) {
  const imageUrl = normalizeProfileImageUrl(value);
  if (!imageUrl || !/\/profile-photos\//i.test(imageUrl) || /\/thumb-[^/]+$/i.test(imageUrl)) return imageUrl;

  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split("/");
    const fileName = parts.pop();
    if (!fileName || fileName.startsWith("thumb-")) return imageUrl;
    parts.push(`thumb-${fileName}`);
    url.pathname = parts.join("/");
    return url.toString();
  } catch {
    return imageUrl.replace(/\/([^/?#]+)([?#].*)?$/, (_match, fileName, suffix = "") => (
      fileName.startsWith("thumb-") ? `/${fileName}${suffix}` : `/thumb-${fileName}${suffix}`
    ));
  }
}

export async function uploadProfileMedia(file: File, userId: string, kind: "avatar" | "banner" = "avatar") {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Profile images must be 8 MB or smaller.");
  if (!userId) throw new Error("Please sign in before uploading an image.");

  const optimized = await optimizeProfileImage(file);
  const uploadedAt = Date.now();
  const path = `${userId}/${kind}-${uploadedAt}.webp`;
  const thumbnailPath = `${userId}/thumb-${kind}-${uploadedAt}.webp`;
  const { error } = await supabase.storage.from("profile-photos").upload(path, optimized.full, {
    cacheControl: "3600",
    contentType: "image/webp",
    upsert: false
  });
  if (error) throw new Error(error.message);
  const { error: thumbnailError } = await supabase.storage.from("profile-photos").upload(thumbnailPath, optimized.thumbnail, {
    cacheControl: "3600",
    contentType: "image/webp",
    upsert: false
  });
  if (thumbnailError) throw new Error(thumbnailError.message);
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
