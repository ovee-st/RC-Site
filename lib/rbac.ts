import type { UserRole } from "@/types";

export const roleHomeRoutes: Record<Exclude<UserRole, "guest">, string> = {
  candidate: "/",
  employer: "/employer",
  employee: "/employee",
  support_agent: "/support",
  support_senior: "/support",
  support_manager: "/support",
  admin: "/admin",
  super_admin: "/admin",
  viewer: "/admin"
};

export const protectedRouteAccess: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin", "super_admin", "viewer"] },
  { prefix: "/employee", roles: ["employee", "support_agent", "support_senior", "support_manager", "admin", "super_admin"] },
  { prefix: "/employer", roles: ["employer", "admin", "super_admin"] },
  { prefix: "/candidate", roles: ["candidate", "admin", "super_admin"] },
  { prefix: "/support", roles: ["candidate", "employer", "employee", "support_agent", "support_senior", "support_manager", "admin", "super_admin", "viewer"] }
];

export function canAccessPath(role: UserRole | null | undefined, pathname: string) {
  const rule = protectedRouteAccess.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  if (!rule) return true;
  return Boolean(role && rule.roles.includes(role));
}

export function normalizeAppRole(value?: string | null): UserRole {
  if (
    value === "candidate" ||
    value === "employer" ||
    value === "employee" ||
    value === "support_agent" ||
    value === "support_senior" ||
    value === "support_manager" ||
    value === "admin" ||
    value === "super_admin" ||
    value === "viewer"
  ) {
    return value;
  }
  return "guest";
}

