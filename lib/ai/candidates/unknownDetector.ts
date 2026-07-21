import type { Unknown } from "@/lib/ai/candidates/types";

export function unknown(field: string, reason = "Not found in resume"): Unknown { return { field, reason }; }
export function detectUnknowns(values: Record<string, unknown>): Unknown[] {
  return Object.entries(values).flatMap(([field, value]) => {
    const missing = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
    return missing ? [unknown(field)] : [];
  });
}
