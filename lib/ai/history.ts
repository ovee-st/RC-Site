export type HistoryKind = "Original Import" | "AI Improved" | "Recruiter Edited";

export type HistoryVersion<T> = {
  id: string;
  kind: HistoryKind;
  createdAt: string;
  label: string;
  snapshot: T;
};

export function addHistoryVersion<T>(history: HistoryVersion<T>[], kind: HistoryKind, snapshot: T, label: string = kind) {
  const serialized = JSON.stringify(snapshot);
  if (history.length && JSON.stringify(history[0].snapshot) === serialized && history[0].kind === kind) return history;
  const version: HistoryVersion<T> = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    createdAt: new Date().toISOString(),
    label,
    snapshot: JSON.parse(serialized) as T
  };
  const next = [version, ...history];
  if (next.length <= 20) return next;
  const original = next.find((item) => item.kind === "Original Import");
  const recent = next.filter((item) => item.id !== original?.id).slice(0, original ? 19 : 20);
  return original ? [...recent, original] : recent;
}

function flatten(value: unknown, prefix = "", output: Record<string, string> = {}) {
  if (Array.isArray(value)) {
    output[prefix] = value.join(", ");
    return output;
  }
  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => flatten(nested, prefix ? `${prefix}.${key}` : key, output));
    return output;
  }
  output[prefix] = value === null || value === undefined ? "" : String(value);
  return output;
}

export function compareHistoryVersions<T>(left: HistoryVersion<T>, right: HistoryVersion<T>) {
  const a = flatten(left.snapshot);
  const b = flatten(right.snapshot);
  return Array.from(new Set([...Object.keys(a), ...Object.keys(b)]))
    .filter((key) => a[key] !== b[key])
    .map((field) => ({ field, before: a[field] || "", after: b[field] || "" }));
}
