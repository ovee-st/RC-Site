export const SUPPORT_STAFF_ROLES = ["support_agent", "support_senior", "support_manager", "employee", "admin", "super_admin", "viewer"] as const;
export type SupportStaffRole = (typeof SUPPORT_STAFF_ROLES)[number];

export function isSupportStaffRole(role?: string | null) {
  return Boolean(role && SUPPORT_STAFF_ROLES.includes(role as SupportStaffRole));
}

export function canViewAllSupport(role?: string | null) {
  return role === "support_senior" || role === "support_manager" || role === "admin" || role === "super_admin" || role === "viewer";
}

export function canManageSupportAssignments(role?: string | null) {
  return role === "support_manager" || role === "admin" || role === "super_admin";
}

export function canEscalateSupport(role?: string | null) {
  return role === "support_senior" || role === "support_manager" || role === "admin" || role === "super_admin";
}

export function canExportSupportReports(role?: string | null) {
  return role === "support_manager" || role === "admin" || role === "super_admin";
}

export function getSupportRoleLabel(role?: string | null) {
  if (role === "support_agent" || role === "employee") return "Support Agent";
  if (role === "support_senior") return "Senior Support";
  if (role === "support_manager") return "Support Manager";
  if (role === "super_admin" || role === "admin") return "Super Admin";
  if (role === "viewer") return "Admin Viewer";
  return "Customer";
}

