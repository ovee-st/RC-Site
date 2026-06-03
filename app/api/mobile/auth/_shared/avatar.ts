import type { SupabaseClient, User } from "@supabase/supabase-js";

type JsonMap = Record<string, any>;

const AVATAR_FIELDS = [
  "avatar_url",
  "photo_url",
  "profile_photo_url",
  "profile_image_url",
  "profile_image",
  "profile_photo",
  "avatar",
  "picture",
  "image_url",
  "company_photo_url",
  "company_avatar_url",
  "company_profile_photo_url",
  "company_profile_image_url",
  "logo_url",
  "company_logo_url",
  "banner_logo_url",
];

const NESTED_FIELDS = [
  "metadata",
  "user_metadata",
  "raw_user_meta_data",
  "profile",
  "candidate",
  "employer",
  "company",
];

const STORAGE_BUCKETS = new Set([
  "avatars",
  "profile-images",
  "profile_images",
  "profile-photos",
  "profile_photos",
  "profiles",
  "candidates",
  "employers",
  "logos",
  "uploads",
]);

function cleanString(value: any) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;
  return trimmed;
}

function siteOrigin() {
  const explicit = cleanString(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = cleanString(process.env.VERCEL_URL);
  return vercel ? `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : "";
}

function normalizeStoragePath(value: string) {
  const withoutQuery = value.split("?")[0] || value;
  const parts = withoutQuery.replace(/^\.\//, "").replace(/^\/+/, "").split("/").filter(Boolean);
  const bucketIndex = parts.findIndex((part) => STORAGE_BUCKETS.has(part));
  if (bucketIndex === -1 || bucketIndex >= parts.length - 1) return null;
  return {
    bucket: parts[bucketIndex],
    path: parts.slice(bucketIndex + 1).join("/"),
  };
}

export function normalizeMobileAvatarUrl(adminClient: SupabaseClient, rawValue: any) {
  const value = cleanString(rawValue);
  if (!value) return null;

  if (/^(https?:|data:image\/)/i.test(value)) return value;

  if (value.startsWith("/")) {
    const origin = siteOrigin();
    return origin ? `${origin}${value}` : value;
  }

  const storagePath = normalizeStoragePath(value);
  if (storagePath) {
    const { data } = adminClient.storage.from(storagePath.bucket).getPublicUrl(storagePath.path);
    return data.publicUrl || null;
  }

  return value;
}

function collectAvatarValues(record: any, values: any[] = [], seen = new Set<any>()) {
  if (!record || typeof record !== "object" || seen.has(record)) return values;
  seen.add(record);

  for (const field of AVATAR_FIELDS) {
    if (field in record) values.push(record[field]);
  }

  for (const field of NESTED_FIELDS) {
    if (record[field]) collectAvatarValues(record[field], values, seen);
  }

  return values;
}

async function fetchOptionalRow(adminClient: SupabaseClient, table: string, column: string, value: string | null | undefined) {
  if (!value) return null;
  try {
    const { data, error } = await adminClient.from(table).select("*").eq(column, value).maybeSingle();
    if (error) return null;
    return data as JsonMap | null;
  } catch {
    return null;
  }
}

export async function fetchRoleProfileRows(adminClient: SupabaseClient, authUser: User | any, role?: string | null) {
  const roleText = String(role || "").toLowerCase();
  const tables = roleText.includes("employer")
    ? ["employers", "employer_profiles"]
    : roleText.includes("candidate")
      ? ["candidates", "candidate_profiles"]
      : ["candidates", "candidate_profiles", "employers", "employer_profiles", "employees"];

  const rows: JsonMap[] = [];
  const seen = new Set<string>();
  const add = (row: JsonMap | null, key: string) => {
    if (!row) return;
    const rowKey = `${key}:${row.id || row.user_id || row.email || rows.length}`;
    if (seen.has(rowKey)) return;
    seen.add(rowKey);
    rows.push(row);
  };

  for (const table of tables) {
    add(await fetchOptionalRow(adminClient, table, "id", authUser.id), `${table}:id`);
    add(await fetchOptionalRow(adminClient, table, "user_id", authUser.id), `${table}:user_id`);
    add(await fetchOptionalRow(adminClient, table, "email", authUser.email), `${table}:email`);
  }

  return rows;
}

export function resolveMobileAvatarUrl(adminClient: SupabaseClient, authUser: User | any, ...records: any[]) {
  const metadata = authUser?.user_metadata || authUser?.raw_user_meta_data || {};
  const values = [
    ...records.flatMap((record) => collectAvatarValues(record)),
    ...collectAvatarValues(metadata),
  ];

  for (const value of values) {
    const normalized = normalizeMobileAvatarUrl(adminClient, value);
    if (normalized) return normalized;
  }

  return null;
}

export function avatarAliases(avatarUrl: string | null | undefined) {
  const value = cleanString(avatarUrl);
  return {
    avatar_url: value,
    photo_url: value,
    profile_photo_url: value,
    profile_image_url: value,
    picture: value,
  };
}
