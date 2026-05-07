import type { UserRole } from "@/types";

export const roleHomeRoutes: Record<Exclude<UserRole, "guest">, string> = {
  candidate: "/",
  employer: "/employer",
  employee: "/employee",
  admin: "/admin",
  viewer: "/admin"
};

export const protectedRouteAccess: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin", "viewer"] },
  { prefix: "/employee", roles: ["employee", "admin"] },
  { prefix: "/employer", roles: ["employer", "admin"] },
  { prefix: "/candidate", roles: ["candidate", "admin"] },
  { prefix: "/support", roles: ["candidate", "employer", "employee", "admin"] }
];

export function canAccessPath(role: UserRole | null | undefined, pathname: string) {
  const rule = protectedRouteAccess.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!rule) return true;
  return Boolean(role && rule.roles.includes(role));
}

export function normalizeAppRole(value?: string | null): UserRole {
  if (value === "candidate" || value === "employer" || value === "employee" || value === "admin" || value === "viewer") {
    return value;
  }
  return "guest";
}
