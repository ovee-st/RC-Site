export const MOCK_USER_KEY = "mx_mock_user";
export const AUTH_CHANGE_EVENT = "mx-auth-change";

export function createStableUsername(name?: string | null, email?: string | null, id?: string | null) {
  const source = name || email?.split("@")[0] || id || "mx-user";
  const cleanSource = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);

  const suffixSource = email || id || source;
  let hash = 0;

  for (let index = 0; index < suffixSource.length; index += 1) {
    hash = ((hash << 5) - hash + suffixSource.charCodeAt(index)) | 0;
  }

  const suffix = Math.abs(hash).toString(36).slice(0, 4).padStart(4, "0");
  return `${cleanSource || "mx-user"}.${suffix}`;
}

export function createRoleUsername(role?: string | null, sequence?: number | null, name?: string | null, email?: string | null, id?: string | null) {
  const normalizedRole = role === "employer" ? "employer" : role === "employee" ? "employee" : role === "admin" ? "admin" : "candidate";
  if (typeof sequence === "number" && Number.isFinite(sequence) && sequence > 0) {
    return `${normalizedRole}_${String(sequence).padStart(6, "0")}`;
  }

  const stable = createStableUsername(name, email, id).replace(/\./g, "-");
  return `MXVL-${stable}`;
}

export function isValidUsername(username?: string | null) {
  return Boolean(username && /^[a-z0-9](?:[a-z0-9_-]{2,28}[a-z0-9])$/.test(username));
}

export function getStableUsername(user?: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  user_metadata?: {
    username?: string | null;
    name?: string | null;
    full_name?: string | null;
  };
} | null) {
  return user?.username
    || user?.user_metadata?.username
    || createStableUsername(user?.name || user?.user_metadata?.full_name || user?.user_metadata?.name, user?.email, user?.id);
}

