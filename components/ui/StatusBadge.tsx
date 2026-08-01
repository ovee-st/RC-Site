import Badge from "@/components/ui/Badge";
import type { ComponentProps } from "react";

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

const statusVariants: Record<string, BadgeVariant> = {
  active: "success",
  approved: "success",
  accepted: "success",
  completed: "success",
  paid: "success",
  pending: "warning",
  waiting: "warning",
  review: "review",
  under_review: "review",
  shortlisted: "review",
  interview: "primary",
  interviewed: "primary",
  scheduled: "primary",
  offer: "primary",
  sent: "primary",
  rejected: "danger",
  declined: "danger",
  failed: "danger",
  suspended: "danger",
  archived: "inactive",
  inactive: "inactive",
  ended: "inactive",
  draft: "draft"
};

export function formatStatus(value: string | boolean | null | undefined) {
  if (value === true) return "Active";
  if (value === false) return "Inactive";
  return String(value || "inactive")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default function StatusBadge({ status, className }: { status: string | boolean | null | undefined; className?: string }) {
  const normalized = String(status ?? "inactive").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  const variant = status === true ? "success" : status === false ? "inactive" : statusVariants[normalized] || "neutral";
  return <Badge variant={variant} className={className}>{formatStatus(status)}</Badge>;
}
