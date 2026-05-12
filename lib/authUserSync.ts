import type { SupabaseClient, User } from "@supabase/supabase-js";

type AnyRecord = Record<string, any>;

const VALID_ROLES = new Set(["candidate", "employer", "employee", "admin", "viewer"]);

export function normalizePlatformRole(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "admin_viewer" || normalized === "admin-viewer" || normalized === "admin (viewer)") return "viewer";
  return VALID_ROLES.has(normalized) ? normalized : null;
}

export function getAuthDisplayName(user: User | AnyRecord) {
  const rawUser = user as AnyRecord;
  const metadata = rawUser.user_metadata || rawUser.raw_user_meta_data || {};
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.company_name ||
    rawUser.email?.split("@")[0] ||
    "RC User"
  );
}

export function createProfileUsername(role: string, email?: string | null, name?: string | null, id?: string | null) {
  const rolePrefix = role === "employer" ? "employer" : role === "employee" ? "employee" : role === "admin" ? "admin" : "candidate";
  const source = name || email?.split("@")[0] || id || rolePrefix;
  const clean = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);

  let hash = 0;
  const hashSource = email || id || source;
  for (let index = 0; index < hashSource.length; index += 1) {
    hash = ((hash << 5) - hash + hashSource.charCodeAt(index)) | 0;
  }
  const suffix = Math.abs(hash).toString(36).slice(0, 4).padStart(4, "0");
  return `${rolePrefix}-${clean || "user"}-${suffix}`.slice(0, 32);
}

function missingColumnFromError(message?: string) {
  if (!message) return null;
  return (
    message.match(/Could not find the '([^']+)' column/i)?.[1] ||
    message.match(/column "?([a-zA-Z0-9_]+)"? .*does not exist/i)?.[1] ||
    null
  );
}

async function safeUpsert(client: SupabaseClient, table: string, rows: AnyRecord[], onConflict: string) {
  if (!rows.length) return { error: null };
  let currentRows = rows;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await client.from(table).upsert(currentRows, { onConflict });
    if (!error) return { error: null };

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn) return { error };

    currentRows = currentRows.map((row) => {
      const { [missingColumn]: _removed, ...rest } = row;
      return rest;
    });
  }

  return { error: new Error(`Could not upsert ${table} after removing incompatible columns.`) };
}

async function safeUpdateBy(client: SupabaseClient, table: string, column: string, value: string, patch: AnyRecord) {
  let currentPatch = patch;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error, count } = await client.from(table).update(currentPatch, { count: "exact" }).eq(column, value);
    if (!error) return { error: null, count: count || 0 };

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn) return { error };

    if (missingColumn === column) return { error, count: 0 };
    const { [missingColumn]: _removed, ...rest } = currentPatch;
    currentPatch = rest;
  }

  return { error: new Error(`Could not update ${table} after removing incompatible columns.`), count: 0 };
}

async function safeInsert(client: SupabaseClient, table: string, row: AnyRecord) {
  let currentRow = row;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await client.from(table).insert(currentRow);
    if (!error || /duplicate key|violates unique constraint/i.test(error.message)) return { error: null };

    const missingColumn = missingColumnFromError(error.message);
    if (!missingColumn) return { error };

    const { [missingColumn]: _removed, ...rest } = currentRow;
    currentRow = rest;
  }

  return { error: new Error(`Could not insert ${table} after removing incompatible columns.`) };
}

export async function listAllAuthUsers(client: SupabaseClient) {
  const users: User[] = [];
  let page = 1;
  const perPage = 1000;

  while (page < 20) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    users.push(...(data.users || []));
    if (!data.users || data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function syncAuthUsersToProfiles(client: SupabaseClient) {
  const users = await listAllAuthUsers(client);
  if (!users.length) return { users, profiles: [] as AnyRecord[] };

  const ids = users.map((user) => user.id);
  const { data: existingProfiles } = await client
    .from("profiles")
    .select("*")
    .in("id", ids);

  const existingById = new Map((existingProfiles || []).map((profile: AnyRecord) => [profile.id, profile]));
  const rows = users.map((authUser) => {
    const existing = existingById.get(authUser.id) || {};
    const metadata = authUser.user_metadata || {};
    const role =
      normalizePlatformRole(existing.role) ||
      normalizePlatformRole(metadata.role) ||
      "candidate";
    const fullName = existing.full_name || existing.name || getAuthDisplayName(authUser);
    const username = existing.username || metadata.username || createProfileUsername(role, authUser.email, fullName, authUser.id);

    return {
      id: authUser.id,
      email: authUser.email || existing.email || "",
      full_name: fullName,
      name: fullName,
      role,
      username,
      avatar_url: existing.avatar_url || metadata.avatar_url || metadata.picture || null,
      photo_url: existing.photo_url || metadata.photo_url || metadata.picture || null,
      plan: existing.plan || metadata.plan || (role === "admin" || role === "viewer" || role === "employee" ? "Internal" : "Basic"),
      verified: existing.verified ?? metadata.verified ?? false,
      updated_at: new Date().toISOString()
    };
  });

  const write = await safeUpsert(client, "profiles", rows, "id");
  if (write.error) throw write.error;

  return { users, profiles: rows };
}

export function candidateFromProfile(profile: AnyRecord) {
  const name = profile.full_name || profile.name || profile.email?.split("@")[0] || "Registered Candidate";
  return {
    id: profile.id,
    user_id: profile.id,
    full_name: name,
    name,
    email: profile.email || "",
    username: profile.username || createProfileUsername("candidate", profile.email, name, profile.id),
    title: profile.title || "Registered Candidate",
    career_level: profile.career_level || profile.experience_level || "Career level not set",
    category: profile.category || "No category",
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    about: profile.about || profile.bio || "",
    photo_url: profile.photo_url || profile.avatar_url || null,
    avatar: profile.avatar_url || profile.photo_url || null,
    location: profile.location || "Bangladesh",
    linkedin_url: profile.linkedin_url || "",
    plan: profile.plan || "Basic",
    verified: Boolean(profile.verified) || String(profile.plan || "").toLowerCase() === "pro",
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    source: "profile"
  };
}

export function employerFromProfile(profile: AnyRecord) {
  const name = profile.full_name || profile.name || profile.email?.split("@")[0] || "Registered Employer";
  return {
    id: profile.id,
    user_id: profile.id,
    company_name: profile.company_name || name,
    contact_person: profile.contact_person || name,
    full_name: name,
    name,
    email: profile.email || "",
    username: profile.username || createProfileUsername("employer", profile.email, name, profile.id),
    phone: profile.phone || "",
    location: profile.location || "Bangladesh",
    industry: profile.industry || "Industry not set",
    company_size: profile.company_size || "",
    about: profile.about || "",
    profile_photo_url: profile.profile_photo_url || profile.avatar_url || profile.photo_url || null,
    avatar_url: profile.avatar_url || profile.photo_url || null,
    logo_url: profile.logo_url || profile.avatar_url || profile.photo_url || null,
    plan: profile.plan || "Basic",
    verified: Boolean(profile.verified),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    source: "profile"
  };
}

export function mergeRowsWithProfiles(rows: AnyRecord[], profiles: AnyRecord[], role: "candidate" | "employer") {
  const map = new Map<string, AnyRecord>();

  rows.forEach((row) => {
    const key = row.user_id || row.id || row.email;
    if (key) map.set(String(key).toLowerCase(), row);
  });

  profiles
    .filter((profile) => normalizePlatformRole(profile.role) === role)
    .forEach((profile) => {
      const key = profile.id || profile.email;
      if (!key) return;
      const normalizedKey = String(key).toLowerCase();
      const fallback = role === "candidate" ? candidateFromProfile(profile) : employerFromProfile(profile);
      const existing = map.get(normalizedKey);
      map.set(normalizedKey, existing ? { ...fallback, ...existing, source: existing.source || "table" } : fallback);
    });

  return Array.from(map.values());
}

export async function ensureRoleRecord(client: SupabaseClient, profile: AnyRecord) {
  const role = normalizePlatformRole(profile.role);
  if (role !== "candidate" && role !== "employer") return;

  const table = role === "candidate" ? "candidates" : "employers";
  const payload = role === "candidate" ? candidateFromProfile(profile) : employerFromProfile(profile);
  const { source: _source, id: _id, ...writePayload } = payload;

  const update = await safeUpdateBy(client, table, "user_id", profile.id, writePayload);
  if (update.error && /column|schema cache/i.test(String(update.error.message))) return;
  if (!update.error && update.count && update.count > 0) return;

  await safeInsert(client, table, { id: profile.id, ...writePayload });
}
