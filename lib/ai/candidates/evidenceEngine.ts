import { confidenceFromScore } from "@/lib/ai/candidates/confidenceEngine";
import { unknown } from "@/lib/ai/candidates/unknownDetector";
import type { EvidenceReference, EvidenceValue } from "@/lib/ai/candidates/types";

function normalize(value: string) { return value.replace(/\s+/g, " ").trim(); }
export function sanitizeResumeText(value: string) {
  const protectedLine = /\b(date of birth|dob|age|gender|sex|religion|race|nationality|marital|pregnan|disabil|political|sexual orientation)\b/i;
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ").split(/\r?\n/).filter((line) => !protectedLine.test(line)).join("\n").slice(0, 80_000);
}

export function findEvidence(rawText: string, field: string, needle: string, source = "Resume"): EvidenceReference[] {
  const cleanNeedle = normalize(needle);
  if (!cleanNeedle) return [];
  const pages = rawText.split("\f");
  for (let index = 0; index < pages.length; index += 1) {
    const normalized = normalize(pages[index]);
    const at = normalized.toLowerCase().indexOf(cleanNeedle.toLowerCase());
    if (at >= 0) return [{ id: `${field}-${index + 1}-${at}`, field, quote: normalized.slice(Math.max(0, at - 80), Math.min(normalized.length, at + cleanNeedle.length + 120)), source, page: pages.length > 1 ? index + 1 : undefined, confidence: 96 }];
  }
  return [];
}

export function evidenceValue<T>(field: string, value: T, evidence: EvidenceReference[], reason = "Not found in resume"): EvidenceValue<T> {
  const present = !(value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0));
  return { value, evidence, confidence: confidenceFromScore(present && evidence.length ? 92 : present ? 60 : 0), unknowns: present ? [] : [unknown(field, reason)] };
}

export function onlyGroundedEvidence(rawText: string, evidence: EvidenceReference[]) { return evidence.filter((item) => normalize(rawText).toLowerCase().includes(normalize(item.quote).toLowerCase())); }
